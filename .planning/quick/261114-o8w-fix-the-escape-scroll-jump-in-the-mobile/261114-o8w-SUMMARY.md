---
phase: quick-261114-o8w
plan: 01
status: complete
subsystem: site-shell
tags: [mobile-menu, focus, scroll, a11y, e2e, tdd]
requires: []
provides:
  - "Escape from the open mobile menu focuses Menu with preventScroll (scroll position kept)"
  - "e2e assertion 'Escape keeps the scroll position' on the 'Escape closes to the button' row"
affects:
  - components/site/SiteNav.tsx
  - e2e/shell.spec.ts
tech-stack:
  added: []
  patterns:
    - "Focus of a sticky-header control uses focus({ preventScroll: true }) because of the global :where(*) scroll-margin-top"
    - "Pin the scroll after focus lands, then measure only the key press's effect with exact toBe equality"
key-files:
  created: []
  modified:
    - e2e/shell.spec.ts
    - components/site/SiteNav.tsx
decisions:
  - "Escape now matches the SHELL-07 tap close: focus Menu with preventScroll; preventDefault, focus, close order unchanged (10-REVIEW CR-01)"
metrics:
  duration: "~2 min of executor wall clock (two production builds)"
  completed: 2026-11-14
estimate:
  tokens: 45000
  tasks: 2
actuals:
  tokens: 640
  tasks: 2
  commits: 2
plan_head_before: 8719718290409626784217590af4f5194a88cc3d
plan_head_after: d03811792eeda8b96911b3ea164520e222d80f00
---

# Quick 261114-o8w Plan 01: Fix the Escape scroll jump in the mobile menu Summary

Escape in the open mobile menu now focuses the Menu button with `{ preventScroll: true }`, so the page keeps its scroll position. An e2e assertion that failed in both engines before the fix now passes.

## What changed

- **Task 1 (RED), `ce35776`, `e2e/shell.spec.ts`:** I extended the row "Menu button and panel rows meet the touch-target sizes; Escape closes to the button" in place. Once focus is on the first panel row, the test pins the page at `min(600, max)`, checks again that focus is still on that row, and reads `scrollAtEscape`. After the existing Escape assertions it checks `expect(scrollY, 'Escape keeps the scroll position').toBe(scrollAtEscape)`. All of the row's earlier assertions are unchanged and the spec still lists 37 tests (GUARD-03).
- **Task 2 (GREEN), `d038117`, `components/site/SiteNav.tsx`:** the `onKeyDown` Escape handler now calls `buttonRef.current?.focus({ preventScroll: true })`. Its comment has one added sentence that points to the tap close's reason. The order `preventDefault` → focus → `setOpen(false)` and the capture registration are unchanged.

## RED evidence (unfixed code, production build)

| Engine   | Failed at                         | Expected | Received |
|----------|-----------------------------------|----------|----------|
| chromium | 'Escape keeps the scroll position' | 600      | 530      |
| firefox  | 'Escape keeps the scroll position' | 600      | 185.5    |

All of the row's earlier assertions passed in both engines (panel hidden, `aria-expanded="false"`, Menu focused). Only the new scroll assertion failed, with the values measured in 14-01. The run exited with rc=1 and the plan's RED gate grep matched.

## GREEN sweep (fixed code, production build)

- `PW_PROD=1 npx playwright test e2e/shell.spec.ts e2e/keyboard.spec.ts e2e/photos-lightbox.spec.ts:507 --project=chromium --project=firefox`: **98 passed** (31.3 s), exit 0. This covers the Task 1 row, SHELL-07/08, the keyboard.spec menu Escape row and the photo-page menu Escape row (CR-01).
- `npx jest components/site/__tests__/SiteNav.test.tsx`: 14/14 passed.
- `npx tsc --noEmit`: clean. `npx eslint components/site/SiteNav.tsx e2e/shell.spec.ts`: clean.
- Grep gates: `focus({ preventScroll: true })` appears 2 times, `focus();` 0 times. The shell spec lists 37 tests.
- Hygiene: `public/service-worker.js` restored after both builds and clean; nothing listens on :3000; each commit touches only its one named file.

WebKit was not run locally, following the repo convention. CI's webkit project will run the row. The pin happens after `rows.nth(0).focus()`, so WebKit's focus scroll is not part of the measurement.

## Deviations from Plan

None. The plan was executed exactly as written.

## Known Stubs

None.

## Commits

- `ce35776` test(quick-261114-o8w): assert Escape keeps the page scroll in the mobile menu row
- `d038117` fix(quick-261114-o8w): focus Menu with preventScroll when Escape closes the mobile menu

## Self-Check: PASSED

- FOUND: e2e/shell.spec.ts (contains "Escape keeps the scroll position")
- FOUND: components/site/SiteNav.tsx (contains "focus({ preventScroll: true })" x2)
- FOUND: ce35776 and d038117 in HEAD's history (`git rev-list --count 8719718..HEAD` = 2)
