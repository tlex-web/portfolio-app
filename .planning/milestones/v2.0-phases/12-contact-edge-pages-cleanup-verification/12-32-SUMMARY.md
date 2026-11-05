---
phase: 12-contact-edge-pages-cleanup-verification
plan: 32
subsystem: ui
tags: [error-boundary, global-error, react-19-title, design-tokens, offline, jest, playwright]
status: complete

requires:
  - phase: 12-27
    provides: "meta.global-error-title in ## Resolved values (follow-up): supplied, `Something went wrong · Tim Lui`"
  - phase: 12-31
    provides: "previous wave tip (sequential)"
provides:
  - "REPORT_LINK in components/site/ErrorBody.tsx: Report this error in the 11 ink-muted text-link style on both error variants (D1)"
  - "GLOBAL_ERROR_TITLE in app/global-error.tsx, rendered as a React title (IN-05)"
  - "Saved-page row hover on surface-overlay in components/site/SavedPages.tsx (D2)"
  - "12-UI-SPEC amendment (2026-11-03, 12-32) beside the action-row link rule and in the Text links interaction-states row"
affects: [12-34]

actuals:
  tokens: 2833
  tasks: 2
  commits: 4
plan_head_before: 64c5e3f088bf6f955c7915ea7a4e9d73a9111734
plan_head_after: 2f809b9d63b8593500e1a172e2138d41efccf918

tech-stack:
  added: []
  patterns:
    - "React 19 title element as the first child of body in global-error (no metadata export there); React hoists it into the head"

key-files:
  created: []
  modified:
    - components/site/ErrorBody.tsx
    - components/site/__tests__/ErrorBody.test.tsx
    - app/global-error.tsx
    - components/__tests__/global-error.test.tsx
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-UI-SPEC.md
    - components/site/SavedPages.tsx
    - components/site/__tests__/SavedPages.test.tsx

key-decisions:
  - "D1: only the error-page Report this error link leaves accent (REPORT_LINK); NotFoundBody keeps its own 07 accent TEXT_LINK, so no not-found baseline moves"
  - "IN-05: global-error ships Tim's 12-27 title 'Something went wrong · Tim Lui' as a React title element, the documented Next 16.4 alternative to metadata in global-error"
  - "D2: saved-page rows hover to surface-overlay, per 12-UI-SPEC colour roles (ink on overlay 13.79:1)"

patterns-established:
  - "Secondary text links in an edge action row use the ink-muted underlined style, so the page's single primary fill is its only accent element"

requirements-completed: [EDGE-01, EDGE-02, SEO-01, VERIFY-04]

duration: 5 min
completed: 2026-11-03

coverage:
  - id: D1
    description: "Report this error on (site)/error and global-error uses the ink-muted text-link style (underline kept, min-h-11), no text-accent; Try again keeps bg-accent; the link keeps its Tab stop after Go to the homepage"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/ErrorBody.test.tsx#%s: Report this error uses the ink-muted text-link style; Try again stays the one accent element (D1)"
        status: pass
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#error page: the h1 holds focus on load and the next Tab reaches Try again (chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: IN-05
    description: "global-error renders one title holding 'Something went wrong · Tim Lui', so a root failure never leaves the document title empty"
    requirement: SEO-01
    verification:
      - kind: unit
        ref: "components/__tests__/global-error.test.tsx#renders one React title holding Tim's meta.global-error-title string, so the document title is never empty (IN-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Saved-page rows on /offline hover to surface-overlay and keep flex, min-h-12 and items-center"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "components/site/__tests__/SavedPages.test.tsx#rows are at least 48 px link rows with line rules that hover to surface-overlay, and no count is shown"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/offline.spec.ts (chromium, firefox, webkit; fresh build)"
        status: pass
    human_judgment: false
---

# Phase 12 Plan 32: Error-page Report link, global-error title and saved-row hover Summary

**Report this error moves to the ink-muted underlined text-link style on both error pages (Try again is now the only accent element), global-error ships Tim's title "Something went wrong · Tim Lui" as a React title, and saved-page rows hover to surface-overlay.**

## Performance

- **Duration:** 5 min (measured 2026-11-03T13:28:23Z to 13:33:25Z)
- **Tasks:** 2 (Task 1 tracer, Task 2 auto; both TDD)
- **Files modified:** 7

## Accomplishments

- D1: `REPORT_LINK = 'inline-flex min-h-11 items-center text-base text-ink-muted underline decoration-1 underline-offset-4 hover:text-ink transition-colors duration-(--duration-fast) ease-erosion'` replaces ErrorBody's accent `TEXT_LINK` on both Report links. NotFoundBody is unchanged (`grep -c text-accent` still 1).
- IN-05: `GLOBAL_ERROR_TITLE` plus `<title>{GLOBAL_ERROR_TITLE}</title>` as the first child of `<body>` in app/global-error.tsx. The JSDoc now says the title is a React title element.
- 12-UI-SPEC: dated amendment under the action-row link rule (line 290) and Report this error added to the "Text links" interaction-states row.
- D2: SavedPages `ROW` hover moves from `hover:bg-surface-raised` to `hover:bg-surface-overlay`. Nothing else in the file changed.

## IN-05 outcome

Shipped. The precondition reader printed `status=supplied value=`Something went wrong · Tim Lui``. The 12-27 row it read:

`| meta.global-error-title | supplied | `Something went wrong · Tim Lui` | "Something went wrong · Tim Lui" |`

## Commits per item (for 12-34's ledgers)

| Item | RED | GREEN |
|------|-----|-------|
| D1 (Report link) | d252a64 `test(12-32): Report link style and global-error title (D1, IN-05)` | 0eff11c `fix(12-32): ink-muted Report link and the global-error title (D1, IN-05)` |
| IN-05 (global-error title) | d252a64 | 0eff11c |
| D2 (saved-row hover) | e48ef7b `test(12-32): saved-page rows hover to surface-overlay (D2)` | 2f809b9 `fix(12-32): saved-page row hover on surface-overlay (D2)` |

## RED evidence

Jest runs at the test commits, before any source change. Jest's default reporter is not one of the classifier's formats (TAP, JUnit, swift-testing, unittest, go test), and no JUnit reporter is installed, so these lines come from the real Jest output and the semantic check below was done by hand.

- D1, both `it.each` cases (`section`, `root`) failed on `toHaveClass`: `Expected the element to have class: text-ink-muted` / `Received: text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center`.
- IN-05 failed on `expect(doc.title).toBe(...)`: `Expected: "Something went wrong · Tim Lui"` / `Received: ""`.
- D2 failed on `toHaveClass("flex min-h-12 items-center hover:bg-surface-overlay")` / `Received: flex min-h-12 items-center justify-between gap-4 py-2 text-base text-ink hover:bg-surface-raised transition-colors duration-(--duration-fast) ease-erosion`.
- Summary lines: Task 1 `Tests: 3 failed, 19 passed, 22 total`; Task 2 `Tests: 1 failed, 5 passed, 6 total`.

**Semantic assessment:** each target test ran and failed on the planned assertion for the planned reason (the old accent class, the missing title, the old raised hover). There were no load, syntax or fixture errors, and every other test in the files passed.

## GREEN results

- `npx jest components/site/__tests__/ErrorBody.test.tsx components/__tests__/global-error.test.tsx --silent`: 22 passed. `npm run guard:contrast`: `contrast: OK (47 pairs)`.
- `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/keyboard.spec.ts -g "error page" --project=chromium`: 1 passed. The walk covers Try again, then Go to the homepage, then Report this error, so the restyled link keeps its Tab stop. This was the tracer gate: verified end to end before Task 2 started.
- `npx jest components/site/__tests__/SavedPages.test.tsx --silent`: 6 passed.

## Acceptance criteria

- `grep -c "text-accent" components/site/ErrorBody.tsx` = 0; `grep -c "text-accent" components/site/NotFoundBody.tsx` = 1: PASS
- `grep -c "className={REPORT_LINK}" components/site/ErrorBody.tsx` = 2: PASS
- `grep -c "<title>" app/global-error.tsx` = 1: PASS
- `grep -c "12-32" 12-UI-SPEC.md` = 2: PASS
- `grep -c "hover:bg-surface-raised" components/site/SavedPages.tsx` = 0; `grep -c "hover:bg-surface-overlay"` = 1: PASS
- The RED commit comes before the GREEN commit for each task (d252a64 before 0eff11c, e48ef7b before 2f809b9): PASS

## Plan-level verification

- `npm run lint` (includes guard:palette and guard:contrast): exit 0
- `npm run type-check`: exit 0
- `npx jest --silent`: 102 suites, 1694 tests passed
- `PW_PROD=1 npx playwright test e2e/keyboard.spec.ts e2e/offline.spec.ts e2e/not-found.spec.ts e2e/audit.spec.ts --project=chromium --project=firefox --project=webkit` on a fresh build: 162 passed, 0 failed, 0 flaky
- Afterwards: `git checkout -- public/service-worker.js` run, port 3000 free, no orphan `next start`

## ui-ux-pro-max checks applied

- `color-not-only`: the Report link keeps its underline (`underline decoration-1 underline-offset-4`), so colour is not the only thing marking it as a link (ux search "link underline color not only", Result 1 "Color Only").
- `color-contrast`: ink-muted text is ≥ 7.67:1 on every surface in the 12-UI-SPEC pairs (8.35 on raised), and it is the same token as the page body copy around it. guard:contrast passes. Saved rows: ink on surface-overlay is 13.79:1.
- `touch-target-size`: `min-h-11` (44 px) is kept on the Report link; saved rows keep `min-h-12`.
- `focus-states`: no outline override; the global `:focus-visible` ring (2 px `--color-focus`, offset 2 px) still applies.
- `primary-action` / `state-clarity`: Try again is the one accent fill. Hover feedback stays a colour transition on `--duration-fast` `ease-erosion` with no layout change.

## Expected visual diffs

none. No committed snapshot covers the error pages or a hover state, and NotFoundBody is unchanged. 12-34's CI Visual Regression run confirms this.

## Deviations from Plan

**1. [Rule 3 - Blocking] Precondition reader run from a scratchpad .js file**
- **Found during:** Task 1 precondition
- **Issue:** On this Windows/Git Bash host, regex and `\n` escapes in `node -e` one-liners get mangled.
- **Fix:** I ran the plan's logic, unchanged, from `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/35d5c653-a7f4-4d78-851d-919d01dec08f/scratchpad/precond-12-32.js` with the same arguments. It exited 0 with `status=supplied`.
- **Files modified:** none in the repo.

**2. [Rule 3 - Blocking] JSDoc wording kept out of the `<title>` grep**
- **Found during:** Task 1 GREEN
- **Issue:** Writing "React `<title>`" in the global-error JSDoc would make `grep -c "<title>"` print 2 instead of 1.
- **Fix:** The JSDoc says "React title element" instead.
- **Commit:** 0eff11c

**3. [Process] Task 2's offline e2e ran on the plan-level fresh build**
- **Issue:** Task 2's `PW_PROD=1 PW_REUSE=1 ... e2e/offline.spec.ts --project=chromium` check would have needed its own build. The plan-level run builds fresh anyway, after the same commit.
- **Fix:** I ran offline.spec once, inside the plan-level fresh-build run (all three engines, including chromium). It passed. The code was the same commit, and the run was a superset of the per-task check.

**Total deviations:** 2 auto-fixed (Rule 3), 1 process consolidation. **Impact:** none on scope or behaviour.

## TDD Gate Compliance

Both TDD tasks have a `test(12-32)` RED commit followed by a GREEN commit that descends from it. Per the plan's action text, the GREEN commits use `fix(12-32)` rather than `feat(12-32)`, so a gate scan that only matches `feat(` will not find them. The order is d252a64, then 0eff11c, then e48ef7b, then 2f809b9.

## Issues Encountered

None.

## Next Phase Readiness

Ready for 12-33.

## Self-Check: PASSED

- All 7 key files exist.
- Commits d252a64, 0eff11c, e48ef7b and 2f809b9 are all ancestors of HEAD.
- `git rev-list --count 64c5e3f..HEAD` = 4.
