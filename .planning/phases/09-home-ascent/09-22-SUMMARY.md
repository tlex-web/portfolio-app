---
phase: 09-home-ascent
plan: 22
subsystem: testing
tags: [home, visual-regression, playwright, ci, baselines, ratchet, service-worker, gap-closure]

requires:
  - phase: 09-home-ascent
    provides: "09-16 to 09-21 gap-closure layout changes (card line breaks, rail layer, compact summit plaque, label placement, measured 3D framing) that change the Home shots"
provides:
  - "One Home re-baseline for the whole gap closure: Tim's commit e9ebee7 (12 home/ PNGs, nothing outside home/)"
  - "Test-count ratchet raised to jest 725 / e2e 241 / total 966 (from 646 / 186 / 832)"
  - "e2e/home-canvas.spec.ts holdHeightmap(): a heightmap hold the test releases itself; 'pins hand over at the reveal' runs with the service worker blocked"
  - "CI green twice on the final tip 05a5e8c (run 40232792001, attempts 1 and 2), with the same PNG tree as e9ebee7"
affects: [09 verification and UAT, Phase 9 close, any later e2e that routes /terrain/ requests]

actuals:
  tokens: 11000
  tasks: 3
  commits: 5
plan_head_before: a1936f4dcbdc16a1cf631c02f7ba7a93940f4aca
plan_head_after: 05a5e8cc8c9c8cc4e97b258e67c380f69ff6c565

tech-stack:
  added: []
  patterns:
    - "A test that routes a request the service worker may answer runs with serviceWorkers: 'block' (page.route never sees a request the worker serves)"
    - "Hold a slow resource until the test releases it (holdHeightmap), never for a fixed time; release again in a finally"

key-files:
  created:
    - .planning/phases/09-home-ascent/09-22-SUMMARY.md
  modified:
    - e2e/visual/routes.spec.ts-snapshots/home/ (12 PNGs, Tim's commit)
    - e2e/home-ascent.spec.ts
    - e2e/home-canvas.spec.ts
    - scripts/guards/test-count.baseline.json
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "09-22: the hand-over e2e failure on the e9ebee7 re-run was a test-harness race, not a product regression: the production service worker (skipWaiting, clients.claim, cache-first /terrain/) answered the heightmap, so page.route and its 2 s delay held nothing; fixed test-only in 05a5e8c (serviceWorkers block + holdHeightmap), Tim's option 'b'"
  - "09-22: the other four delayHeightmap users share the bypass but pass; left unchanged and logged as an open deferred item for Tim (scope: the failing test, one push, one re-run)"
  - "09-22: test-count ratchet raised at the gap-closure close: jest 646 -> 725, e2e 186 -> 241, total 832 -> 966"

patterns-established:
  - "Service worker and request interception: block the worker in any e2e whose assertions depend on page.route holding or changing a same-origin asset"

requirements-completed: [HOME-02, HOME-04, HOME-05, HOME-06]

coverage:
  - id: D1
    description: "One Home re-baseline covering 09-16 to 09-21, committed and pushed by Tim (e9ebee7): 12 home/ PNGs, nothing outside home/"
    requirement: HOME-05
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha e9ebee7 --some --allow home (OK, 12 changed)"
        status: pass
    human_judgment: true
    rationale: "Tim committed and pushed the PNGs ('pushed') without commenting on the review checklist (S1-S4, W1-W2, T1, R1-R2); whether each shot looks right is his call and is still open"
  - id: D2
    description: "CI green twice on the final tip with the same PNG tree as Tim's commit: run 40232792001 on 05a5e8c, attempt 1 and its one re-run (attempt 2), every job green, E2E 355 passed / 0 flaky each time"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 05a5e8c --job 'E2E Tests' (attempts 1 and 2)"
        status: pass
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 05a5e8c --job 'Visual Regression' (attempts 1 and 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Test-count ratchet above the 09-14 values: jest 725, e2e 241, total 966, recorded at e9ebee7"
    verification:
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-results.json (jest 725 + e2e 241 = 966, OK)"
        status: pass
    human_judgment: false
  - id: D4
    description: "'pins hand over at the reveal' holds the heightmap until its loading checks are done, with the service worker blocked; every hand-over assertion unchanged"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts -g 'pins hand over' --project=chromium --repeat-each=10 (production server: 10/10; 6x CPU throttle copy: 10/10)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts --project=chromium (45 passed)"
        status: pass
    human_judgment: false

duration: 3h 20m
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 22: Home Re-baseline, CI and Ratchet Summary

**Tim re-baselined the 12 Home shots for the gap closure in one commit (e9ebee7). The test-count ratchet rose to 966. The hand-over e2e failed on the re-run because the service worker bypassed `page.route`. A test-only hold fixed it, and CI then passed twice on 05a5e8c.**

## Performance

- **Duration:** about 3h 20m wall clock, most of it CI and waits for Tim's replies
- **Started:** about 2026-10-25T18:00Z (after a1936f4, 17:59:13Z)
- **Completed:** 2026-10-25T21:20Z
- **Tasks:** 3 of 3
- **Files modified:** 17. Tim's commit has 12 PNGs. The rest: e2e/home-ascent.spec.ts, e2e/home-canvas.spec.ts, scripts/guards/test-count.baseline.json, deferred-items.md and this SUMMARY.

## Tim's replies (literal)

| Point | Question | Tim's reply |
|-------|----------|-------------|
| Task 1 | The push to a new ci/09-22, one visual dispatch and one re-run of the run on his baseline commit | "Approve" |
| Task 2 | Review the Home shots, then commit and push the PNGs | "pushed" (no comment on the review checklist) |
| After the failed re-run | Three options; option B: fix the test properly, test-only, then CI on the new commit plus one re-run. Needed from Tim: one fast-forward push to ci/09-22, CI on it and one `gh run rerun` | "b" |

## Accomplishments

- **One Home re-baseline for the whole gap closure.** Visual dispatch 40228415066 on f13abc1 produced the new shots. Tim reviewed, committed and pushed them himself as `e9ebee7`. `check-snapshot-commit --sha e9ebee7 --some --allow home` reported OK with 12 changed and nothing outside home/.
- **Ratchet raised.** In `4c926e8`: jest 646 to 725, e2e 186 to 241, total 832 to 966, recorded at e9ebee7.
- **Deferred items brought up to date.**
  - The summit plaque, 768 waypoint-2 label and 375 kicker entries are resolved.
  - The pin-3 static-poster case is accepted under the D-09 amendment ("Accept, amend D-09").
  - S3 and the reduced-motion plaque overlap are new open entries.
  - The hand-over failure has its own resolved entry, with the diagnosis.
  - The other `delayHeightmap` users are a new open entry.
- **Hand-over e2e fixed, test-only (`05a5e8c`).** The fix and the evidence are under Deviations below.
- **CI green twice** on 05a5e8c, which has the same PNG tree as e9ebee7: run 40232792001, attempt 1 and its one re-run.

## CI runs

| Run | SHA | Event | Result |
|-----|-----|-------|--------|
| 40223572017 | a1936f4 | push | E2E failed: 11 failures from the card line-break helper on Linux (fixed in f13abc1). Visual Regression failed on home/* as expected. Lint, Unit, Build and Security passed. |
| 40226717927 | f13abc1 | push | E2E passed. Visual Regression failed on home/* only, as expected before the re-baseline. Every other job passed. |
| 40228415066 | f13abc1 | workflow_dispatch (visual-baselines, suite visual, update_mode changed) | success. The artifact held the 12 changed home PNGs. |
| 40229497215 attempt 1 | e9ebee7 (Tim) | push | all green |
| 40229497215 attempt 2 | e9ebee7 (Tim) | the one re-run from "Approve" | Visual Regression passed again (determinism). E2E failed: 1 failed and 354 passed. The failure was "pins hand over at the reveal" on all three tries. |
| 40232792001 attempt 1 | 05a5e8c | push (the fast-forward from "b") | all green. E2E 355 passed, 0 flaky. |
| 40232792001 attempt 2 | 05a5e8c | the one re-run from "b" | all green. E2E 355 passed, 0 flaky. Visual Regression passed. |

`check-visual-run.mjs --sha 05a5e8c` passed with `--job "E2E Tests"` and with `--job "Visual Regression"` on both attempts. The jobs were 121287896213 and 121287896576 on attempt 1, and 121290622105 and 121290622192 on attempt 2.

## Changed PNGs (e9ebee7), per slug against the plan's lists

| Shot | Plan list | Changed | Note |
|------|-----------|---------|------|
| home/375-ascent-waypoint-2 | expected | yes | 09-16 kicker and place line |
| home/375-ascent-summit | expected | yes | 09-18 compact plate |
| home/375-reduced | expected | yes | 09-16 reduced card place line; 09-18 summit scrim removed |
| home/768-ascent-start | expected | yes | 09-17 rail above the hero scrim; 09-19 pins above the rail scrim |
| home/768-ascent-waypoint-2 | expected | yes | 09-19 label placement |
| home/768-ascent-summit | expected | yes | 09-18 compact plate |
| home/768-reduced | expected | yes | 09-17, 09-19 |
| home/1440-ascent-start | expected | yes | 09-17: the lg scrim tail no longer touches '2,760 m approx.' |
| home/1440-reduced | expected | yes | 09-17, same scrim tail |
| home/375-ascent-start | expected unchanged | **yes** | Text smoothing on "Menu" only, at x 289-332, y 26-37. Shown to Tim with a note. |
| home/1440-ascent-waypoint-2 | expected unchanged | **yes** | Rail column, x 1206-1374: the 09-17/09-19 rail and scrim layering. Shown to Tim with a note. |
| home/1440-ascent-summit | expected unchanged | **yes** | Rail column, x 1206-1374: same layering. Shown to Tim with a note. |

All 12 are under home/. Every other slug (clix-cli, clix-website, contact, not-found, offline, photos, projects, roadmap) is byte-identical, and nothing outside home/ was copied or committed.

## Task Commits

1. **Task 1: Tim's go-ahead.** Checkpoint, no commit. Reply: "Approve".
2. **Task 2: CI, re-baseline, CI twice.**
   - `f13abc1` (fix, Rule 1): the card line-break helper loads only the primary web font.
   - `e9ebee7` (test, **Tim's commit**): re-baseline Home for the Phase 9 gap closure.
   - `03bfe82` (docs): the failed E2E on the re-run, recorded in deferred items.
   - `05a5e8c` (fix, Rule 1): the hand-over test holds the heightmap until its loading checks are done.
3. **Task 3: ratchet and deferred items.** `4c926e8` (chore): ratchet raised after the Phase 9 gap closure.

**Plan metadata:** the docs commit that records this SUMMARY, STATE.md and ROADMAP.md.

## Files Created/Modified

- `e2e/visual/routes.spec.ts-snapshots/home/*.png` (12 files): the new Home baselines. Tim committed them.
- `e2e/home-ascent.spec.ts`: the card line-break helper loads only 'JetBrains Mono' and asserts that at least one face loaded (f13abc1).
- `e2e/home-canvas.spec.ts`: the new `holdHeightmap()` helper. "pins hand over at the reveal" runs in a describe with `serviceWorkers: 'block'` and holds the heightmap, then releases it (05a5e8c).
- `scripts/guards/test-count.baseline.json`: jest 725, e2e 241, total 966 (4c926e8).
- `.planning/phases/09-home-ascent/deferred-items.md`: the gap entries are resolved, pin 3 is accepted, S3 and the reduced-motion overlap are open, the hand-over failure is resolved, and the `delayHeightmap` bypass is open.

## Decisions Made

- The hand-over failure is a harness race, not a product regression (diagnosis below). Tim chose option "b", a test-only fix. No product code changed in this plan.
- The fix blocks the service worker as well as adding the hold. The brief asked for a hold the test releases itself. On its own, a hold through `page.route` would have been bypassed in the same way, so the worker block is the part that removes the root cause. Both are test-only.
- The other four `delayHeightmap` users were left unchanged and logged for Tim (see Issues).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The card line-break e2e helper failed on the Linux CI runner**
- **Found during:** Task 2 step 2 (run 40223572017)
- **Issue:** The helper passed the computed font-family list ('JetBrains Mono', 'JetBrains Mono Fallback') to `document.fonts.load`. next/font's fallback face is `src: local(Arial)`, and the CI runner has no Arial. So the whole load rejected with NetworkError in Chromium and Firefox: 11 failures. Windows has Arial, so the test passed locally.
- **Fix:** Load only the primary family, and assert that at least one face loaded.
- **Files modified:** e2e/home-ascent.spec.ts
- **Verification:** E2E passed on run 40226717927 and on every later run.
- **Committed in:** f13abc1

**2. [Process] An extra fast-forward push to ci/09-22 (a1936f4..f13abc1)**
- **Found during:** Task 2 step 2
- **Issue:** Tim's Task 1 "Approve" covered the option text "plain push to a new ci/09-22, one dispatch, one gh run rerun". Step 2 of the plan says to fix an E2E failure in a commit on this plan, fast-forward push ci/09-22 and repeat. The approval's wording did not name a second push, so this push went past it.
- **Outcome:** It was a plain fast-forward with no force, and the phase branch and main were not pushed. It is recorded here because the approval did not cover it.

**3. [Rule 1 - Bug] "pins hand over at the reveal" failed on the one re-run of Tim's commit**
- **Found during:** Task 2 step 6 (run 40229497215 attempt 2)
- **Issue:** The test failed on all three tries. Tries 1 and 3 read `data-ascent-mode` "3d" where the test expects "eligible". Try 2 read the 3D layer as `visible` one read after the poster layer read `visible`.
- **Diagnosis (confirmed; refines the orchestrator's time-window hypothesis):**
  - The 2 s delay never held anything, on any run. The production build registers `public/service-worker.js`, which calls `skipWaiting` and `clients.claim` and serves `/terrain/` cache-first. It controlled the page before the heightmap request, and `page.route` does not intercept a request the service worker answers.
  - Trace of try 2, the only one recorded (`trace: on-first-retry`):
    - load at +267 ms;
    - the 3D layer appears at +730 ms;
    - the heightmap goes out at +762 ms, as a worker-side fetch with no frame;
    - the page's own response comes back from the worker within 20 ms, with transfer size 0;
    - "eligible" passes at +830 ms;
    - the 3D-visibility read starts at +956 ms and takes 900 ms while the main thread builds the mesh, and it returns "visible".
  - Locally on the production server, the unchanged test failed 6 of 10.
  - A diagnostic spec, not committed, ran 5 times with the worker allowed and 5 times with it blocked. Allowed: the route handler ran 0 times, every response came from the worker, and in 3 of the 5 runs the mode was already '3d' when the 3D layer appeared. Blocked: the route handler ran once and the mode was 'eligible' every time.
  - The test only ever passed when building the mesh outlasted its checks.
  - Not a product regression: with the heightmap held, the D-09 hand-over contract passes on every run. That contract: both layers flip in one style recalc, all four 3D pins show, and each sits within 2 px of its poster pin.
- **Fix:**
  - The new `holdHeightmap(page)` holds every heightmap request until `release()`, then calls `route.continue().catch(() => {})`.
  - "pins hand over at the reveal" runs in `test.describe('with the service worker blocked')` with `test.use({ serviceWorkers: 'block' })`.
  - Order: hold, goto, 3D layer count 1, the request is seen, "eligible" and both visibilities, the MutationObserver, `release()`, `waitForRevealed`, the hand-over assertion. A `finally` releases the request again, so a failed check never leaves it held.
  - All assertions and the test's intent are unchanged. The leaf title is unchanged; the describe path gains "with the service worker blocked".
  - Prettier also rewrapped `settledPinBoxes()` (whitespace only). That was the last pre-existing Prettier drift in this file, and the brief required `prettier --check` to pass.
- **Files modified:** e2e/home-canvas.spec.ts
- **Verification:**
  - Locally, against `npm run build && npm run start`:
    - `--repeat-each=10`: 10/10;
    - a throwaway copy under CDP `Emulation.setCPUThrottlingRate` 6 with `--workers=1`: 10/10;
    - the whole file in chromium: 45/45.
  - eslint, `prettier --check` and `tsc --noEmit` are clean.
  - `lib/__tests__/frame-budget-policy.test.ts` passes (16/16), and the test stays classified measure-only.
  - The ratchet is unchanged at 966 (e2e count still 241).
  - CI run 40232792001 was green on attempt 1 and on its re-run.
- **Committed in:** 05a5e8c

---

**Total deviations:** 3: two auto-fixed (Rule 1) and one process deviation (the extra push).
**Impact on plan:** Both fixes are test-only and needed for CI evidence. No product code changed. One acceptance check was not met on Tim's SHA itself: E2E failed on the re-run of e9ebee7. Run 40232792001 met the twice-green requirement on 05a5e8c, whose PNG tree is identical to e9ebee7. Visual Regression passed on both attempts on e9ebee7 as well.

## Issues Encountered

- **The four other `delayHeightmap` users share the service-worker bypass.** They are "reveal keeps the layout", "a load abandoned for reduced motion reveals nothing", "a late canvas reveals at the current progress" and "a canvas revealed while stationary lights its 3D pin". A local diagnostic on the production server ran the route handler 0 times in 8 of 8 runs, with a wheel scroll and with waypoint 2 centred. They pass today because their checks finish before the mesh is built, but they can flake the same way. The fix is one `test.use({ serviceWorkers: 'block' })` for those tests or for the file. It was left unchanged (scope, and the single authorized push) and logged as an open deferred item for Tim.
- The build rewrote `public/service-worker.js` for the local production server; it was restored with `git checkout` before the commit.

## Open items (not approved; Tim has not commented)

- **The 09-22 review checklist:** S1-S4, W1-W2, T1 and R1-R2, the summit, waypoint-2, start and reduced checks from Task 2 step 4. Tim committed and pushed the PNGs ("pushed") with no comment on any of them.
- **S3:** on the phone summit shots, pin 4 is cut off at the right edge and the summit triangle is off the left edge. It predates plan 22 and is open in deferred-items.
- **The planner's three design choices from Task 1:**
  - the stats relocated after the summit frame in the compact layout (D-15 note);
  - card-aware above/below labels with the pins above the rail scrim;
  - measured md stage targets.
  Tim's reply was "Approve", which did not address them.
- **09-18 reduced-motion overlap:** under reduced motion the full summit plaque covers the poster pins at 375 x 667 with the summit centred. Open in deferred-items.
- **New:** the `delayHeightmap` service-worker bypass in four tests. Open in deferred-items.
- **Pre-existing:** `lib/useAscentMode.ts` fails `prettier --check`. Open. The spec half of that entry is now clean.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- All 22 Phase 9 plans have SUMMARYs. The phase is ready for verification and UAT.
- These open items go to Tim at the phase close or UAT: the review checklist, S3, the three design choices and the reduced-motion overlap. Tim also decides on the `delayHeightmap` follow-up.
- ci/09-22 is at 05a5e8c. The phase branch is not pushed by this plan.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files: 09-22-SUMMARY.md, e2e/home-canvas.spec.ts, scripts/guards/test-count.baseline.json and the 12 home/ PNGs exist.
- Commits: f13abc1, e9ebee7, 4c926e8, 03bfe82 and 05a5e8c are ancestors of HEAD. `git rev-list --count a1936f4..05a5e8c` is 5.
- Acceptance checks:
  - `check-snapshot-commit --sha e9ebee7 --some --allow home`: OK (12 changed).
  - `check-visual-run --sha 05a5e8c`, with `--job "E2E Tests"` and with `--job "Visual Regression"`: PASS on attempts 1 and 2 of run 40232792001.
  - `test-count.mjs`: jest 725 + e2e 241 = 966, OK.
  - Ratchet above 832 / 646 / 186.
  - deferred-items: the three gap entries are resolved and the pin-3 entry is accepted, citing the D-09 amendment.
- Not met as written: the E2E re-run on Tim's SHA e9ebee7 (run 40229497215 attempt 2). It was replaced by the twice-green run on 05a5e8c, which has the same PNG tree, under Tim's "b". See Deviations 3.
