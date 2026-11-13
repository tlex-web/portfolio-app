---
phase: 13-repo-safety-test-debt
plan: 09
subsystem: testing
tags: [react, jest, playwright, view-transitions, lightbox, hotspots, ledger]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-06 ledger triage, approved 2026-11-13 (10 IN-02, IN-06, IN-07, IN-09, IN-10 fix-now, owner 13-09)"
provides:
  - "LightboxDialog resets its closing flag each time it is shown (10 IN-10)"
  - "lib/photos/css-escape.ts cssEscape shared by LightboxDialog and PhotoViewer (10 IN-02)"
  - "Unused onZoomChange `at` and HotspotKey `labelsOn` parameters removed (10 IN-06)"
  - "Hotspot facts keyed by hotspot id and index (10 IN-07)"
  - "waitForViewTransitionsSettled e2e helper; three lightbox absence samples wait for a positive settle signal (10 IN-09)"
affects: [13-22, phase-14, phase-17, phase-18]

actuals:
  tokens: 5461
  tasks: 3
  commits: 8
plan_head_before: 13c508e6d72aabc3c1570565b111f4962e11c55b
plan_head_after: 86b34dc2f5c5a5677ea32938ac22b6f3b1b6ae21

tech-stack:
  added: []
  patterns:
    - "Absence-only e2e samples wait for settled === count on the view-transition recorder (finished promises), never a fixed sleep"
    - "Selectors built from data go through lib/photos/css-escape.ts cssEscape"

key-files:
  created:
    - lib/photos/css-escape.ts
    - lib/__tests__/css-escape.test.ts
  modified:
    - components/photos/LightboxDialog.tsx
    - components/photos/PhotoViewer.tsx
    - components/photos/ZoomStage.tsx
    - components/photos/Hotspots.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - components/photos/__tests__/hotspots.test.tsx
    - e2e/photos-lightbox.spec.ts
    - e2e/helpers/view-transitions.ts

key-decisions:
  - "10 IN-09: the three lightbox-spec tests survive Phase 18 and are fixed; the photos-sweep switchTo 600 ms wait covers the Map/Grid/Carousel switch Phase 18 retires and is handed to Phase 18 (for 13-22 to record)"
  - "10 IN-09 settle signal: the view-transition recorder counts settled transition.finished promises (the review's suggested fix), so settled === count is polled before each absence sample"
  - "10 IN-07: facts have no id in the data, so the key is `${hotspot.id}-${i}`; the per-hotspot list is static"
  - "10 IN-02: jest-dom's css.escape polyfill gives the Jest environment a global CSS.escape, so tests that need the fallback remove it for their duration"

patterns-established:
  - "waitForViewTransitionsSettled(page) before reading readViewTransitions for an absence assertion"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "10 IN-10: LightboxDialog can close again after it is shown again in the same instance"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#closes again after it is shown again in the same instance (10-REVIEW IN-10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "10 IN-02: one cssEscape with a fallback serves PhotoViewer and LightboxDialog; the callout's Escape layer works without CSS.escape"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "lib/__tests__/css-escape.test.ts"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#Escape collapses an open callout before it closes, without CSS.escape (10-REVIEW IN-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "10 IN-06: unused at and labelsOn parameters removed"
    requirement: VERIFY-07
    verification:
      - kind: other
        ref: "npm run type-check"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/hotspots.test.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "10 IN-07: hotspot facts keyed by hotspot id and index, no duplicate-key warning for shared text"
    requirement: VERIFY-07
    verification:
      - kind: unit
        ref: "components/photos/__tests__/hotspots.test.tsx#two facts with the same text both render, with no duplicate-key warning (10-REVIEW IN-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "10 IN-09: the surviving absence-only lightbox assertions wait for a positive settle signal"
    requirement: VERIFY-07
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-sweep.spec.ts --project=chromium (72 passed, 0 flaky)"
        status: pass
    human_judgment: false
  - id: D6
    description: "No rendered pixel and no visible string changes"
    requirement: VERIFY-07
    verification: []
    human_judgment: true
    rationale: "Pixel neutrality is proven by Visual Regression on the mid-phase PR (13-15), not by this plan's runs; the diff changes no className, text node or rendered attribute (only a React key and removed props)"

duration: 11min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 09: Phase 10 Photo-Component Ledger Rows Summary

**LightboxDialog can close again after it is shown again, one `cssEscape` with a fallback serves both viewers, the unused `at` and `labelsOn` parameters are gone, hotspot facts have stable keys, and the three surviving absence-only lightbox e2e samples wait on a `transition.finished` settle count instead of fixed sleeps.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-13T11:16:10Z
- **Completed:** 2026-11-13T11:27:22Z
- **Tasks:** 3
- **Files modified:** 10 (2 created, 8 modified)

## Accomplishments

- 10 IN-10: the layout effect's setup sets `closing.current = false`, so a dialog instance that outlives a back step can close again. A second press during one close still goes back only once.
- 10 IN-02: `lib/photos/css-escape.ts` holds the fallback that used to live inside LightboxDialog. PhotoViewer's `collapseCallout` no longer calls `CSS.escape` directly.
- 10 IN-06: `onZoomChange(z)` without `at`, and `HotspotKey` without `labelsOn`. The type-check proves no caller relied on either.
- 10 IN-07: `<li key={`${hotspot.id}-${i}`}>`, with a comment saying why.
- 10 IN-09: the view-transition recorder counts settled `finished` promises. `waitForViewTransitionsSettled` polls `settled === count` before each absence sample.

## Row → commit table (for 13-22)

| Row | Disposition | RED | GREEN / change |
|-----|-------------|-----|----------------|
| 10 IN-10 | fixed | `86b2456` | `722517b` |
| 10 IN-02 | fixed | `f03c424` | `0aac3d3` |
| 10 IN-06 | fixed | n/a (no behaviour; type-check is the proof) | `69160aa` (refactor) |
| 10 IN-07 | fixed | `7670c17` | `ecd59d2` |
| 10 IN-09 | fixed for the 3 surviving lightbox tests; the sweep `switchTo` wait is handed to Phase 18 | n/a (test-only change) | `86b34dc` |

## Task Commits

1. **Task 1: Lightbox closing reset (10 IN-10)**: `86b2456` (test, RED), `722517b` (feat, GREEN)
2. **Task 2: cssEscape (10 IN-02), unused parameters (10 IN-06), fact keys (10 IN-07)**: `f03c424` (test, RED), `0aac3d3` (feat, GREEN), `69160aa` (refactor), `7670c17` (test, RED), `ecd59d2` (feat, GREEN)
3. **Task 3: Positive settle signals (10 IN-09)**: `86b34dc` (test)

## TDD Gate Compliance

| Row | RED evidence (TAP via scratchpad jest-tap-reporter, `--silent`) | Verdict | Semantic assessment |
|-----|------------------------------------------------------------------|---------|---------------------|
| 10 IN-10 | `.git/gsd-red-13-09-t1.json`: exit 1, 6 tests, 1 failed | `RED_EVIDENCE_OK` (target_test_failed) | The target ran and failed on its final `toHaveBeenCalledTimes(2)` with 1 call. The once-only assertion before it passed, so the failure is the never-reset flag, not setup. |
| 10 IN-02 | `.git/gsd-red-13-09-t2-in02.json`: exit 1, 7 tests, 1 failed | `RED_EVIDENCE_OK` (target_test_failed) | The real modal PhotoViewer inside LightboxDialog opened a callout, then failed the planned `aria-expanded="false"` assertion: `collapseCallout` threw `TypeError: CSS.escape is not a function` at `PhotoViewer.tsx:340`. The first capture had jsdom's uncaught-error console output ahead of the TAP and was rejected as `invalid_record`. The rerun with `--silent` keeps it out; the console output is kept separately in the scratchpad. |
| 10 IN-07 | `.git/gsd-red-13-09-t2-in07.json`: exit 1, 10 tests, 1 failed | `RED_EVIDENCE_OK` (target_test_failed) | The two-listitem assertion passed. The planned no-duplicate-key assertion failed on React's "Encountered two children with the same key, `Same claim.`" (4 times: gutter and key panels). |

Each RED was followed by a GREEN in a later commit. IN-06 and IN-09 have no RED: IN-06 removes parameters with no runtime effect (the type-check is the proof, as the triage row says), and IN-09 changes only tests.

## Acceptance checks

- Task 1: `git show 722517b -- components/photos/LightboxDialog.tsx` adds one statement and a comment. No JSX attribute or className changed.
- Task 2: `cssEscape` count is 2 in PhotoViewer.tsx and 2 in LightboxDialog.tsx. `CSS.escape` in PhotoViewer.tsx: baseline 1 (line 340) at HEAD `13c508e`, now 0. No className or text node changed. The only JSX changes are a React `key` and the removed `labelsOn` prop.
- Task 3, changed assertions (each waits for a positive locator or state first):
  - `browser Back closes with no view transition`: open settled (`waitForViewTransitionsSettled`), then after Back, focus on `[data-photo-id="{first.slug}"]` (polled), then settled, then `count === before`.
  - `a step morphs nothing`: open settled, then after the step, the dialog's h2 shows `views[1].title` (visible), then settled, then no `photo-*` pseudo.
  - `under reduced motion the open runs no view-transition animation`: Close focused (existing), then settled, then no `::view-transition*` pseudo.
- `waitForTimeout` in the two files: 7 before (6 lightbox + 1 sweep), 2 after (lightbox `:281` `1500 - elapsed`, outside IN-09; sweep `switchTo`, handed over). No duration was increased.
- Test count unchanged: 50 `test(` calls in photos-lightbox.spec.ts before and after. 72 listed in Chromium, 72 passed, 0 flaky.

## Handed to Phase 18 (13-22 records it)

- **10 IN-09, `e2e/photos-sweep.spec.ts:214`:** `switchTo`'s 600 ms `waitForTimeout` after each Map/Grid/Carousel press. It exists only for the view switch, which Phase 18 removes (ROADMAP Phase 18, success criterion 1: "The Map/Grid/Carousel switch is gone … the view tests are rewritten").

## Files Created/Modified

- `lib/photos/css-escape.ts`: `cssEscape(value)`, which uses CSS.escape when present, else escapes quotes and backslashes
- `lib/__tests__/css-escape.test.ts`: both paths, node environment
- `components/photos/LightboxDialog.tsx`: closing reset on show; uses the shared `cssEscape`
- `components/photos/PhotoViewer.tsx`: `collapseCallout` uses `cssEscape`; no `labelsOn` to HotspotKey
- `components/photos/ZoomStage.tsx`: `onZoomChange(z: boolean)`
- `components/photos/Hotspots.tsx`: HotspotKey props without `labelsOn`; fact keys `${hotspot.id}-${i}`
- `components/photos/__tests__/lightbox-dialog.test.tsx`: stable mock router; IN-10 and IN-02 cases
- `components/photos/__tests__/hotspots.test.tsx`: IN-07 case; HotspotKey gets only its own props
- `e2e/helpers/view-transitions.ts`: `settled` count and `waitForViewTransitionsSettled`
- `e2e/photos-lightbox.spec.ts`: three settle waits replace five sleeps

## Decisions Made

- The IN-09 settle signal is the review's own suggestion (a `transition.finished` count kept by the helper), not `document.getAnimations().length === 0`. Unrelated page animations would make the latter unreliable, and it misses a transition whose update callback has not run yet.
- The IN-10 test keeps the instance mounted with React 19.3's `Activity` (hidden, then visible), which is the scenario the review names.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The IN-09 settle signal needed the view-transition helper, which is outside files_modified**
- **Found during:** Task 3
- **Issue:** The recorder had no positive "finished" state to wait on. The plan's files list names only the two specs.
- **Fix:** Added a `settled` count and `waitForViewTransitionsSettled` to `e2e/helpers/view-transitions.ts`. The change is additive: no consumer compares the whole record, and `e2e/photos.spec.ts` is unaffected.
- **Files modified:** e2e/helpers/view-transitions.ts
- **Verification:** 72/72 Chromium on the production build; type-check and eslint clean
- **Committed in:** `86b34dc`

**2. [Rule 1 - Test premise] Jest has a global CSS.escape, through jest-dom's css.escape polyfill**
- **Found during:** Task 2 (IN-02 RED)
- **Issue:** The review says jsdom has no `CSS.escape`. jsdom 26.1 doesn't, but `jest.setup.js` imports `@testing-library/jest-dom`, which loads the `css.escape` polyfill, even in `@jest-environment node`. A naive RED would have passed, and the node-env unit test would never have run the fallback.
- **Fix:** The IN-02 component test and the cssEscape "without" cases remove the global for their duration and restore it afterwards.
- **Files modified:** components/photos/__tests__/lightbox-dialog.test.tsx, lib/__tests__/css-escape.test.ts
- **Committed in:** `f03c424`, `0aac3d3`

**3. [Rule 1 - Test hygiene] The lightbox suite's mock router is now one stable object**
- **Found during:** Task 1
- **Issue:** The mock returned a new router on every render, unlike Next's. That re-ran the dialog's layout effect on every render and left no way to count `back()` calls.
- **Fix:** One `mockRouter` shared by the suite, cleared before each test
- **Committed in:** `86b2456`

**4. [Rule 1 - Comment accuracy] Hotspots header comment**
- "the key ignores labelsOn" now reads "the key takes no labelsOn" (`69160aa`).

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 test or comment accuracy)
**Impact on plan:** All are needed to prove the rows honestly. No production behaviour beyond the five rows changed.

## Issues Encountered

- The first IN-02 RED record was rejected as `invalid_record`: jsdom's uncaught-error console output went to stdout ahead of the TAP report. Rerunning with Jest's `--silent` gave `RED_EVIDENCE_OK`.
- The production build rewrote `public/service-worker.js` (postbuild hash). It was restored with `git checkout -- public/service-worker.js` and not committed. Playwright stopped its own `next start`, and port 3000 is free.

## Known Stubs

None.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- 13-22 can take the row → commit table above, plus the Phase 18 handover of the sweep `switchTo` wait.
- Pixel neutrality is confirmed by Visual Regression on the mid-phase PR (13-15).

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*

## Self-Check: PASSED

- All 10 files in key-files exist on disk.
- All 8 commits (`86b2456`, `722517b`, `f03c424`, `0aac3d3`, `69160aa`, `7670c17`, `ecd59d2`, `86b34dc`) are ancestors of HEAD; `check evaluation-scope --plan 13-09 --commits-only` resolves them from plan subjects.
- Verification: jest 105 suites and 1,745 tests passed; `tsc --noEmit` clean; eslint clean; Chromium e2e 72/72 on the production build.
