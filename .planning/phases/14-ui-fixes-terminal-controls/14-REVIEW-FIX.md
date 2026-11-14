---
phase: 14-ui-fixes-terminal-controls
fixed_at: 2026-11-14T14:34:21Z
review_path: .planning/phases/14-ui-fixes-terminal-controls/14-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-11-14T14:34:21Z
**Source review:** .planning/phases/14-ui-fixes-terminal-controls/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03; Tim chose "Fix all 3 now")
- Fixed: 3
- Skipped: 0
- Out of scope: IN-01 to IN-06, deferred to Phase 15 and left untouched

`fix_scope` is `critical_warning`, which normally excludes necessity findings. WR-02 carries `**Category:** necessity`, but Tim explicitly chose to fix all three warnings, so it was applied.

## Fixed Issues

### WR-01: `revealFocusedRow` also scrolls the panel on pointer focus

**Files modified:** `components/site/SiteNav.tsx`, `components/site/__tests__/SiteNav.test.tsx`
**Commit:** b8f3b1f
**Status:** fixed: requires human verification (logic change on an interaction path)
**Applied fix:** `revealFocusedRow` now returns early unless `row.matches(':focus-visible')`. The docblock says why: Firefox focuses on mousedown, and a scroll between mousedown and mouseup can move the row out from under the pointer.

There were no existing SiteNav Jest rows for the reveal, so no row became vacuous. jsdom matches `:focus-visible` on any focused element, so it cannot tell keyboard focus from pointer focus by itself. Two rows were added, using a fixed layout (panel 64 to 324, rows 56 px apart):
- **Tab focus reveals:** Tab through the rows to Contact, and `scrollTop` goes from 0 to 28. This pins the keyboard path.
- **Pointer press does not reveal (WR-01):** a mousedown-only press (`[MouseLeft>]`) focuses Contact. The browser's `:focus-visible = false` answer is stubbed, and `scrollTop` stays 0. Against the pre-fix SiteNav this row fails with `Expected: 0, Received: 28`.

Browser proof (prod build, `next start`):
- `e2e/shell.spec.ts`: SHELL-08 rows green in Chromium and Firefox. That includes the Firefox 375 x 320 row, which needs `scrollTop > 0`, and Firefox depends on `revealFocusedRow` for that scroll. So the keyboard reveal still works with the gate, both through Tab and after the keyboard-driven open.
- A scratch probe pressed the partly hidden Contact row with the mouse at 375 x 320. In Firefox and in Chromium: the row was focused, `:focus-visible` was false, `scrollTop` stayed 0 after mousedown, and the click navigated to `/contact`. The probe ran on the fixed build only; the pre-fix failure is shown by the Jest row.

### WR-02: The Previous/Next end press is guarded three times (necessity)

**Files modified:** `components/projects/DemoTerminal.tsx`, `components/projects/__tests__/DemoTerminal.test.tsx`
**Commit:** ea7d7f2
**Status:** fixed: requires human verification (necessity finding: code removed)
**Applied fix:** Both step buttons now use `onClick={() => show(stepTo(state.index, ±1, count))}`, so `stepTo` (null at the ends) and `show` (null means nothing changes and nothing is pressed) own D-03. `aria-disabled` is unchanged.

The Next end-press Jest row only checked `data-command`, and Pause was already pressed when it ran. It was rewritten, not deleted: it now releases Pause first and also asserts that the end press leaves `aria-pressed="false"`, matching the Previous row. As a check, a temporary change made `show` press Pause on a null target. Both end rows failed under that change, and it was reverted before the commit. The D-03 browser row ("the step buttons stop at the ends") is green in Chromium and Firefox.

### WR-03: The D-23 shell row clicks Menu before hydration

**Files modified:** `e2e/shell.spec.ts`
**Commit:** 050b15b
**Status:** fixed
**Applied fix:** Added the `__reactProps` hydration poll before `button.click()` on `/photos?view=grid`. It is the same wait the D-16 row and `openMenuByKeyboard` use. The row is green in Chromium and Firefox.

## Verification

All gates ran in the **main checkout** on `gsd/phase-14-ui-fixes-terminal-controls`. No worktree was used: the orchestrator said to commit sequentially on this working tree, and `workflow.use_worktrees` is unset. The results can be reproduced from this tree.

- `npx jest`: 105 suites, **1797/1797** passed. This is 1795 + 2 new SiteNav rows, and no row was deleted (GUARD-03).
- `npm run lint` (eslint plus all guards): exit 0.
- `npm run type-check`: clean. `tsc` excludes `e2e/**`, so Playwright's transpile covered `e2e/shell.spec.ts`.
- `npx next build` (no postbuild), then `npm run start`:
  - `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/shell.spec.ts --project=chromium --project=firefox`: **74 passed**.
  - `e2e/case-study.spec.ts -g "ENG-06|D-03|D-02"` on Chromium and Firefox: **34 passed**.
  - The `next start` on :3000 was stopped afterwards.
  - `public/service-worker.js` was not rewritten.
- WebKit was not run locally (not installed); CI covers it.

---

_Fixed: 2026-11-14T14:34:21Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
