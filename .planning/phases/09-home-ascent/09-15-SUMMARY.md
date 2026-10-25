---
phase: 09-home-ascent
plan: 15
subsystem: ui
tags: [r3f, webgl, frame-budget, playwright, visibilitychange, requestAnimationFrame]

requires:
  - phase: 09-home-ascent
    provides: "CameraRig reveal burst and frame budget (09-11), measure-only flag and policy guard (09-11, 09-13, 09-14)"
provides:
  - "CameraRig update() drops a running reveal burst on the shown -> hidden transition, so a hidden tab can no longer decline a capable device (G-09-5, WR-01)"
  - "holdFramesWhileHidden: a page-side background-tab model (holds every rAF callback while hidden) for deterministic hidden-tab e2e tests"
  - "Regression test 'a tab hidden during the reveal burst restarts it at device scale 1/2' (RED before the fix, GREEN after)"
  - "Context-loss e2e on the measure-only budget (WR-02)"
  - "IN-05 documented: downgrade and pixel-ratio step-down last the session, until a full reload"
affects: [09-home-ascent verification, HOME-07, HOME-02, D-18]

actuals:
  tokens: 5600
  tasks: 2
  commits: 3
plan_head_before: 1826e6d602a54a0f7ef59d59162f1ff44070c70f
plan_head_after: 49a3dac837c2478f078233412cf3e68451d86264

tech-stack:
  added: []
  patterns:
    - "Hidden-tab e2e: model the tab page-side (rAF trampoline that queues while hidden + visibility getters), because Playwright's focus emulation makes CDP freeze and bringToFront no-ops"
    - "Pause handling in the flag handler, not the frame loop: a background tab runs no frame"

key-files:
  created: []
  modified:
    - components/home/terrain/CameraRig.tsx
    - e2e/helpers/webgl.ts
    - e2e/home-canvas.spec.ts
    - lib/__tests__/frame-budget-policy.test.ts
    - lib/useAscentMode.ts
    - components/home/terrain/TerrainCanvas.tsx
    - .planning/phases/09-home-ascent/09-REVIEW-DISPOSITION.md
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "WR-01 fix lives in CameraRig update(): on shown -> hidden a running burst is dropped (budget null, burstStart -1, burstPaused true) and the existing branch restarts it when the stage shows again; the useFrame 'running && !shown' drop stays as the off-screen fallback; no gap-based restart rule, FRAME_BUDGET_DEFAULTS unchanged"
  - "The update() drop only fires while a burst runs (budget.current set), so a tab switch after the verdict never re-measures"
  - "IN-05 (Tim: 'Keep sticky, document'): downgraded and dprSteppedDown stay module-level; JSDoc says the downgrade lasts the session, until a full reload"
  - "WR-02 (Tim: 'Include'): 'context loss falls back to the poster' runs on the measure-only budget"

patterns-established:
  - "holdFramesWhileHidden(page, { hideAfterFrames }) + window.__tab.show(): the hidden-tab model for any future pause test"

requirements-completed: [HOME-07, HOME-02]

coverage:
  - id: D1
    description: "A tab hidden during the reveal burst gets a fresh burst on return and keeps 3D, at device scale 1 (dpr 1) and 2 (dpr 1.5)"
    requirement: HOME-07
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#a tab hidden during the reveal burst restarts it at device scale ${scale}"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#pauses while the tab is hidden"
        status: pass
    human_judgment: false
  - id: D2
    description: "Context-loss e2e no longer races the real frame budget; budget tests keep the real one"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/frame-budget-policy.test.ts#classifies every home-canvas test, in order"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts --project=chromium -g \"context loss|slow device|records the frame-budget\""
        status: pass
    human_judgment: false
  - id: D3
    description: "IN-05: the session-long downgrade is documented in useAscentMode and TerrainCanvas, behaviour unchanged"
    verification:
      - kind: unit
        ref: "lib/__tests__/useAscentMode.test.tsx"
        status: pass
      - kind: other
        ref: "grep -c \"until a full reload\" lib/useAscentMode.ts components/home/terrain/TerrainCanvas.tsx"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 15: Hidden-tab reveal burst (G-09-5, WR-01) Summary

**CameraRig now drops a reveal burst in its visibility/IntersectionObserver handler when the stage stops being shown, proven by a page-side hidden-tab e2e (rAF held while hidden) that failed on the old rig and passes at device scale 1 and 2; plus the WR-02 measure-only context-loss test and the IN-05 session-long downgrade JSDoc.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-25T16:09:33Z
- **Completed:** 2026-10-25T16:17:26Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Root cause fixed: a background tab runs no animation frame, so the old `running && !shown` drop in useFrame never ran. `update()` now drops a running burst on the shown -> hidden transition, and the existing restart branch gives a fresh budget on return.
- `holdFramesWhileHidden` gives the suite a hidden tab that behaves the way Chromium's does. CDP freeze and bringToFront do nothing under Playwright's focus emulation.
- Table-driven regression test over device scales 1 and 2. It checks that the hide fell inside a live burst, that no draws or verdicts happen while hidden, and that the first verdict after the show comes from a fresh burst.
- WR-02: the context-loss test runs on the measure-only budget. The policy guard classifies it and the new test.
- IN-05: the docs say the downgrade lasts the session (module state, until a full reload). No behaviour change.

## RED run (unchanged CameraRig, commit 450b2a6)

`npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "hidden"`: 2 failed, 1 passed ('pauses while the tab is hidden').

```
a tab hidden during the reveal burst restarts it at device scale 1
  Error: the first verdict after the show comes from a fresh burst (got samples 2, 0.3 ms after the show)
  Expected: true
  Received: false

a tab hidden during the reveal burst restarts it at device scale 2
  Error: the first verdict after the show comes from a fresh burst (got samples 3, 0.4 ms after the show)
  Expected: true
  Received: false
```

The stale verdict landed within one frame of the show (0.3 / 0.4 ms), carrying the pre-hide samples (2 / 3). That matches the debug note's signature.

## GREEN run (after 9f35845)

Same command: 3 passed. Annotations:

| Device scale | drawsAtHide - drawsAt3dStart | First verdict after the show |
|---|---|---|
| 1 | 3 | ok, samples 20, dpr 1, median 19.6 ms, 392.3 ms after the show |
| 2 | 3 | ok, samples 20, dpr 1.5, median 22.6 ms, 450.8 ms after the show |

In both rows the stage stayed '3d' and there was no 'ascent-downgrade' mark.

## Task Commits

1. **Task 1: hidden-tab helper and failing test (RED)**: `450b2a6` (test)
2. **Task 1: update() burst drop (GREEN)**: `9f35845` (fix)
3. **Task 2: WR-02 measure-only context loss, IN-05 JSDoc**: `49a3dac` (test)

**Plan metadata:** this docs commit (SUMMARY, review disposition, deferred item, STATE, ROADMAP)

## Files Created/Modified

- `components/home/terrain/CameraRig.tsx`: burst drop in `update()`, header comment rewritten, useFrame drop commented as the fallback
- `e2e/helpers/webgl.ts`: `holdFramesWhileHidden` and the `HiddenTab` type; budgetMeasureOnly JSDoc lists the 09-15 opt-ins
- `e2e/home-canvas.spec.ts`: the new two-row test; `budgetMeasureOnly` in 'context loss falls back to the poster'
- `lib/__tests__/frame-budget-policy.test.ts`: PHONE_3D adds context loss and the hidden-tab test (comment no longer says "ten"); the ordered list is updated
- `lib/useAscentMode.ts`, `components/home/terrain/TerrainCanvas.tsx`: IN-05 JSDoc ("until a full reload")
- `.planning/phases/09-home-ascent/09-REVIEW-DISPOSITION.md`: WR-01, WR-02 and IN-05 marked fixed, `open: 6`
- `.planning/phases/09-home-ascent/deferred-items.md`: pre-existing Prettier drift logged

## Decisions Made

- The `update()` drop is guarded by `budget.current`, so only a running burst is dropped. A tab switch after the verdict leaves `burstPaused` false and never re-measures. That keeps T-09-25 bounded: a restart needs a hidden/off-screen -> shown transition during a burst.
- The TerrainCanvas sentence on SafeCanvas's load-error downgrade ("for the rest of the page view") now says "session" too, so the file does not contradict IN-05.
- The ui-ux-pro-max skill was not loaded. This plan changes no visual output (pause logic, tests and docs only).

## Deviations from Plan

**1. [Rule 3 - Blocking] Review-disposition rows committed in the plan-metadata commit, not the Task 2 commit**
- **Found during:** Task 2, step 3
- **Issue:** The plan asks for Source "09-15 <short sha>". WR-02 and IN-05 are fixed by the Task 2 commit, and a commit cannot contain its own sha.
- **Fix:** The Task 2 commit (`49a3dac`) holds the code and test changes. The disposition update (WR-01 -> `9f35845`, WR-02 and IN-05 -> `49a3dac`, `open: 6`) goes into the docs commit for this plan.
- **Files modified:** .planning/phases/09-home-ascent/09-REVIEW-DISPOSITION.md
- **Verification:** `grep -n "open: 6"`; the table rows read `fixed | 09-15 <sha>`

---

**Total deviations:** 1 (Rule 3, commit placement only)
**Impact on plan:** None on behaviour or tests.

## Issues Encountered

- `prettier --check` already fails at 1826e6d on lines of `e2e/home-canvas.spec.ts` and `lib/useAscentMode.ts` that this plan does not touch. A `--write` would have reformatted unrelated code, so it was reverted. Only the 09-15 additions are formatted, and the drift is logged in deferred-items.md. `npm run lint` passes.

## Verification

- `npx playwright test e2e/home-canvas.spec.ts --project=chromium`: 28 passed (the whole canvas spec, including both new rows)
- `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: OK, jest 648 + e2e 188 = 836 (baseline 832)
- `npm run lint && npm run type-check`: both exit 0
- `git diff 2e77999 -- lib/ascent/frame-budget.ts`: empty

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- G-09-5 is closed in code and test. UAT Test 5 can be re-run: on a real tab, switch away during the canvas fade and come back. The stage should stay 3D.
- Ready for 09-16.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files exist: CameraRig.tsx, webgl.ts, home-canvas.spec.ts, frame-budget-policy.test.ts, useAscentMode.ts, TerrainCanvas.tsx, 09-REVIEW-DISPOSITION.md
- Commits on this branch: 450b2a6, 9f35845, 49a3dac (`git rev-list --count 1826e6d..HEAD` = 3 before this docs commit)
- Acceptance criteria re-run: all pass
