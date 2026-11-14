---
phase: 15-region-plate-data-model
plan: 14
subsystem: ui
tags: [lightbox, focus-reveal, sitenav, playwright, jest, firefox, d-28]

requires:
  - phase: 15-13
    provides: the previous plan tip (4c2a21b); GUARD-10 type-checking of the specs touched here
  - phase: 14-ui-fixes-terminal-controls
    provides: revealTrigger / restoreFocus (LBOX-08), the SHELL-07 current-link close, the ENG-06 terminal rows, and 14-REVIEW IN-01..06
provides:
  - "navHeightPx() in components/photos/LightboxDialog.tsx: --nav-h resolved through a probe sized var(--nav-h), any unit"
  - "revealTrigger measures the viewport bottom with document.documentElement.clientHeight"
  - "e2e triggerState mirrors both (probe + clientHeight)"
  - "function closeOnCurrentLink(event, href) in SiteNav DefaultNav, with the single 'Close trigger 7' block comment above it"
  - "e2e/case-study.spec.ts imports TIMINGS and waits TIMINGS.holdMs + 1000"
  - "A Firefox/Linux-WebKit browser-Back row in 'Focus on close stays in view' (Map 720x450, @no-win-webkit)"
affects: [15-15, 15-16, phase-18-lightbox-rewrite, 14-REVIEW-DISPOSITION]

actuals:
  tokens: 4300
  tasks: 3
  commits: 3
plan_head_before: 4c2a21b1a85bbf1cfdf62252a963345fa0eb0d32
plan_head_after: 065d628e26de5fc0e75403235f0ad0c001be355d

tech-stack:
  added: []
  patterns:
    - "Resolve a CSS length variable in any unit with a hidden probe sized var(--x), measured and removed in the same call"
    - "An e2e mirror of a measurement helper changes in the same commit as the helper, with the same method"

key-files:
  created: []
  modified:
    - components/photos/LightboxDialog.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - e2e/photos-lightbox.spec.ts
    - components/site/SiteNav.tsx
    - e2e/case-study.spec.ts

key-decisions:
  - "Nav-height helper is named navHeightPx() and reads the probe through getBoundingClientRect().height (fractional), not offsetHeight (rounded), so a non-integer nav height is not under-cleared"
  - "The new Firefox browser-Back row passed (8/8 repeats); no Playwright #43967 crash, so no @firefox-43967 tag was added"
  - "Prettier was not run over whole files: e2e/photos-lightbox.spec.ts and SiteNav.tsx were already not Prettier-clean at HEAD, and a whole-file format would have added unrelated churn; only the touched hunks follow the house style"

patterns-established:
  - "Probe measurement: unit-independent CSS variable reads without parsing the raw value"

requirements-completed: [GUARD-10]

coverage:
  - id: D1
    description: "revealTrigger reads --nav-h in any unit (probe) and the viewport via documentElement.clientHeight (14 IN-01, IN-02)"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#revealTrigger clears a nav height given in rem by its resolved px, not the parsed number (14 IN-01)"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#revealTrigger measures the viewport bottom with documentElement.clientHeight (14 IN-02)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox (122 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "e2e triggerState mirrors revealTrigger's probe and clientHeight measurement"
    requirement: GUARD-10
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Focus on close stays in view (LBOX-08), Chromium + Firefox, 17 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "SiteNav current-link close is the named closeOnCurrentLink(event, href) with one 'Close trigger 7' comment; SHELL-07 behaviour unchanged (14 IN-03)"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteNav.test.tsx (14 passed)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/shell.spec.ts --project=chromium --project=firefox -g 'SHELL-07|D-23' (4 passed); full shell spec 74 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "ENG-06 'nothing advanced' waits derived from TIMINGS.holdMs (14 IN-05)"
    requirement: GUARD-10
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox -g ENG-06 (20 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Firefox-capable browser-Back row in 'Focus on close stays in view' (14 IN-06)"
    requirement: GUARD-10
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Map at 720x450: step to the last photo, browser Back, the trigger is fully in view @no-win-webkit (Firefox, --repeat-each=8: 8/8)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 14: Phase 14 info findings IN-01/02/03/05/06 Summary

**revealTrigger and its e2e mirror resolve `--nav-h` through a `var(--nav-h)` probe and use `clientHeight`; SiteNav's current-link close is a named `closeOnCurrentLink`; the terminal waits derive from `TIMINGS.holdMs`; and browser Back on the lightbox now runs in Firefox and Linux WebKit. No pixels change.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-14T22:35:11Z
- **Completed:** 2026-11-14T22:45:19Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- **14 IN-01:** the new `navHeightPx()` helper in `LightboxDialog.tsx` appends a hidden, absolutely positioned probe sized `var(--nav-h)` to `body`, reads `getBoundingClientRect().height` and removes the probe in the same call. A rem or `calc()` nav height is now cleared in full. If the variable is missing, the probe's height is auto, so the result is 0, the same fallback as before. `triggerState` in the e2e spec uses the same probe, so the mirror can no longer agree with a broken value.
- **14 IN-02:** the bottom check in `revealTrigger` and `triggerState` uses `document.documentElement.clientHeight`. The outward rounding, `RING_PX` and window-only scrolling are unchanged, and the JSDoc has one sentence on each change.
- **14 IN-03:** `function closeOnCurrentLink(event, href)` sits where the orphan "Close trigger 7" block was, with that block above it. The inline handler's duplicate explanation was merged into it, so the text now appears once. The panel links pass `onClick={(event) => closeOnCurrentLink(event, item.href)}`. The statements, their order and every condition are unchanged: plain primary click, strict `href !== pathname`, `preventDefault` only with an empty `location.search`, focus Menu with `preventScroll`, then `setOpen(false)`. The Escape comment's "the tap close below" now reads "above".
- **14 IN-05:** both `waitForTimeout(4000)` calls are now `waitForTimeout(TIMINGS.holdMs + 1000)`, importing from `@/lib/demo-terminal` (an import-free module). Each has a one-line reason.
- **14 IN-06:** a new `ROWS` entry `{ view: 'Map', width: 720, height: 450, setup: 'a', close: 'browser Back', tags: '@no-win-webkit' }` sits next to the Chromium-only Back row, with a comment explaining why. It runs in Chromium, Firefox and Linux WebKit. Windows WebKit drops it, as it does every history close. It passed in Firefox without a crash.
- **Jest:** the jsdom precondition row ("reads --nav-h from the root element") was rewritten in place. It now proves that the probe is sized `var(--nav-h)` and is removed. Two rows were added: a rem nav (`--nav-h: 4rem`, probe measures 64, delta uses 64, not 4) and a clientHeight row (innerHeight is 17 px taller, the delta follows clientHeight). Full Jest went from 1910 to 1912 tests in 113 suites.

## Task Commits

1. **Task 1: revealTrigger and triggerState measure the nav and viewport unit-independently (14 IN-01, IN-02)** - `66eb7f2` (fix)
2. **Task 2: named closeOnCurrentLink handler in SiteNav (14 IN-03)** - `c24b622` (refactor)
3. **Task 3: TIMINGS-derived waits and a Firefox-capable browser-Back row (14 IN-05, IN-06)** - `065d628` (test)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY.

## Files Created/Modified

- `components/photos/LightboxDialog.tsx`: `navHeightPx()` probe helper; `revealTrigger` uses it and `clientHeight`; JSDoc updated
- `components/photos/__tests__/lightbox-dialog.test.tsx`: the revealTrigger block stubs `documentElement.clientHeight` and the probe's measured height (an `Element.prototype.getBoundingClientRect` spy that only the probe reaches); precondition row rewritten; rem and clientHeight rows added
- `e2e/photos-lightbox.spec.ts`: `triggerState` mirrors the probe and `clientHeight`; new Firefox-capable browser-Back row
- `components/site/SiteNav.tsx`: `closeOnCurrentLink(event, href)` with the merged "Close trigger 7" comment; `MouseEvent as ReactMouseEvent` type import
- `e2e/case-study.spec.ts`: `import { TIMINGS } from '@/lib/demo-terminal'`; two derived waits

## Verification

| Check | Result |
|-------|--------|
| `npx jest components/photos/__tests__/lightbox-dialog.test.tsx components/site/__tests__/SiteNav.test.tsx` | 2 suites, 35 passed |
| Full `npx jest` | 113 suites, 1912 passed |
| `PW_PROD=1` photos-lightbox.spec.ts, chromium + firefox (Task 1 build) | 122 passed, 0 flaky |
| `PW_PROD=1` shell.spec.ts `-g "SHELL-07\|D-23"`, chromium + firefox | 4 passed; full shell spec 74 passed |
| `PW_PROD=1` case-study.spec.ts `-g ENG-06`, chromium + firefox | 20 passed |
| `PW_PROD=1` photos-lightbox.spec.ts `-g LBOX-08`, chromium + firefox | 17 passed (15 Chromium rows + Escape and the new Back row in Firefox) |
| New Back row, `--repeat-each=8` | 24/24 (both Back rows in Chromium, the new one in Firefox) |
| `npm run type-check`, `npm run lint` (incl. `guard:tests:scan`) | exit 0 |
| `git diff --quiet HEAD -- public/service-worker.js` after every build | exit 0 |
| Client JS (`rm -rf .next/static && npm run build`, 15-01 script) | 1,851,572 B in 24 files; cap 1,854,478 B (2,906 B headroom; +447 B since 15-11) |

Acceptance greps: `innerHeight` appears 0 times in LightboxDialog.tsx and 0 in photos-lightbox.spec.ts. `parseFloat` appears 0 times in LightboxDialog.tsx. `function closeOnCurrentLink` appears 1 time and `Close trigger 7` 1 time. `waitForTimeout(4000)` appears 0 times and `TIMINGS.holdMs` 2 times. `close: 'browser Back'` appears 2 times, and the Firefox `--list` shows 2 lines containing "browser Back" (the new LBOX-08 row and the existing LBOX-02 row).

## Decisions Made

- The helper is `navHeightPx()`. It reads `getBoundingClientRect().height` rather than `offsetHeight`. The plan allowed either, and the rounded `offsetHeight` could under-clear a fractional nav height by up to 0.5 px.
- The probe lives in `body` and the nav's own box is not queried, because SiteNav renders two header elements. That reason is in the helper's JSDoc.
- No `@firefox-43967` tag: the new row ran cleanly in Firefox.
- Edits were formatted to the house style one hunk at a time. Prettier was not run over whole files, because two of the touched files were already not Prettier-clean at HEAD.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `jest.SpyInstance` is not in the project's Jest typings**
- **Found during:** Task 1 (type-check)
- **Issue:** `__tests__/jest-globals.d.ts` (15-01) aliases `Spied`/`SpiedFunction`, not `SpyInstance`, so `let rectSpy: jest.SpyInstance` failed with TS2694
- **Fix:** typed the spy structurally as `{ mockRestore(): void }`
- **Files modified:** components/photos/__tests__/lightbox-dialog.test.tsx
- **Verification:** `npm run type-check` exits 0
- **Committed in:** 66eb7f2

**2. [Rule 2 - Coverage] Added a clientHeight Jest row**
- **Found during:** Task 1
- **Issue:** the plan asked only for the rem row. Without a row for IN-02, nothing in Jest would fail if the bottom check went back to `innerHeight`
- **Fix:** a row where `innerHeight` is 17 px taller than `clientHeight` and the scroll delta follows `clientHeight`
- **Files modified:** components/photos/__tests__/lightbox-dialog.test.tsx
- **Committed in:** 66eb7f2

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 coverage)
**Impact on plan:** None on behaviour or pixels. One test row more than planned; no test was deleted or skipped (GUARD-03).

## Issues Encountered

- The first scripted edit missed its targets because the files are checked out with CRLF line endings. The edit scripts were changed to normalise endings and write back with the original ones.
- Two builds ran: one for Task 1, and a clean `.next/static` rebuild after Task 2 for the client-JS measurement. Task 3 changed only e2e specs and reused that server. `public/service-worker.js` was restored after each build, and port 3000 is free at the end.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 14 IN-01, IN-02, IN-03, IN-05 and IN-06 are fixed with the SHAs above, ready for the 14-REVIEW-DISPOSITION write-back (D-29). IN-04 stays deferred to Phase 18 (D-29) and was not touched.
- Ready for 15-15.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: all five modified files exist
- FOUND: commits `66eb7f2`, `c24b622`, `065d628` (ancestors of HEAD; `git rev-list --count 4c2a21b..HEAD` = 3)
- Acceptance criteria for all three tasks re-run: all PASS
