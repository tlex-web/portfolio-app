---
phase: 12-contact-edge-pages-cleanup-verification
plan: 31
subsystem: ui
tags: [react-19, callback-ref, intersection-observer, three, service-worker, jest, playwright]

requires:
  - phase: 12-30
    provides: "public/service-worker.js storeCopy + waitUntil (WR-04); this plan's IN-04 is its client half"
  - phase: 12-18
    provides: "useProgressiveTextures compiler-clean loader contract"
provides:
  - "observeRegion callback ref in DemoTerminal (WR-02): the IntersectionObserver follows the region node"
  - "sourcesKey in useProgressiveTextures (IN-03): the loader reloads on new URLs at the same count"
  - "SW_UPDATE_INTERVAL_MS and startUpdateChecks in lib/sw-update.ts (IN-04): the hourly check stops on unmount and catches update()"
affects: [12-34]

actuals:
  tokens: 5460
  tasks: 3
  commits: 6
plan_head_before: 9eb415bdd5795a0ad072221b77106c9ff68eea35
plan_head_after: b2fb90e94bf71dd29c02618738e06e7281602ee7

tech-stack:
  added: []
  patterns:
    - "React 19 callback ref with cleanup (useCallback, [] deps) for an observer that must follow its DOM node"
    - "Effect keyed on a URL-derived string, plus a tracked-key reset during render, instead of a count key"
    - "Interval helpers return a stop function; a stopped flag covers a promise that resolves after stop"

key-files:
  created: []
  modified:
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - lib/useProgressiveTextures.ts
    - lib/__tests__/useProgressiveTextures.test.ts
    - components/ServiceWorkerRegistration.tsx
    - lib/sw-update.ts
    - lib/__tests__/sw-update.test.ts

key-decisions:
  - "WR-02: the review's 4 -> 2 shrink path does not remove the region node (React discards a render-phase update's null output and re-renders before commit), so the literal shrink case passes at HEAD and stays as a regression guard; the real removed-node path is a list that empties and grows again, which got its own RED case"
  - "IN-03: sourcesKey joins each source's thumbSrc and fullSrc; the loader effect is keyed on [sourcesKey, count]"
  - "IN-04: startUpdateChecks takes Pick<ServiceWorkerContainer, 'register'> so Jest drives it with a fake container; lib/sw-update.ts stays import-free"

patterns-established:
  - "Observer-on-a-node: attach through a callback ref returning a disconnect cleanup, never a mount-only effect reading an object ref"

requirements-completed: [VERIFY-01, VERIFY-03, EDGE-02]

coverage:
  - id: D1
    description: "DemoTerminal's IntersectionObserver follows its region through an emptied-and-refilled list and a late first command, so visibility still pauses and resumes playback (WR-02)"
    requirement: VERIFY-03
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#follows the region when the list empties and grows again: the removed node is let go and the new one observed (WR-02)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#observes the region when its first commands arrive after an empty list (WR-02)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/case-study.spec.ts e2e/keyboard.spec.ts --project=chromium --project=firefox --project=webkit"
        status: pass
    human_judgment: false
  - id: D2
    description: "useProgressiveTextures reloads when the source URLs change at the same count, disposes the old textures and never returns them; the same URLs in a new array start no load (IN-03)"
    requirement: VERIFY-01
    verification:
      - kind: unit
        ref: "lib/__tests__/useProgressiveTextures.test.ts#reloads when the sources change at the same count: new thumbnails, old textures disposed and never returned (IN-03)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/useProgressiveTextures.test.ts#starts no new load for a new array holding the same URLs (IN-03)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-carousel.spec.ts (three engines)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The hourly service-worker update check stops on unmount (also before registration resolves) and a rejected update() is caught; the real worker still installs and takes control (IN-04)"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/sw-update.test.ts#startUpdateChecks (IN-04)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 PW_REUSE=1 npx playwright test e2e/service-worker.spec.ts --project=chromium (4 passed)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 31: Client hooks follow their inputs (WR-02, IN-03, IN-04) Summary

**DemoTerminal observes its region through a React 19 callback ref with a disconnect cleanup, the carousel texture loader is keyed on the joined source URLs, and the hourly service-worker update check moved into `startUpdateChecks`, which returns a stop function and catches `update()` rejections.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-11-03T13:10:32Z
- **Completed:** 2026-11-03T13:23:05Z
- **Tasks:** 3 (Task 1 tracer, Tasks 2-3 auto, all TDD)
- **Files modified:** 7

## Accomplishments

- WR-02: `observeRegion` (`useCallback`, `[]` deps) replaces `regionRef` and the mount-only observer effect. React calls it with each new region node and runs its cleanup when the node goes. `useReducedMotion()` is still read during render (the keyboard spec's forced error page still lands on `app/(site)/error.tsx`). The shrink guard, D-24 layout and markup are unchanged.
- IN-03: `sourcesKey` (each source's `thumbSrc\nfullSrc`, joined with `\n`) replaces the count as the loader's identity. A tracked-key reset during render (same body as the old trackedCount reset) drops the old textures in the same render. The loader effect is keyed on `[sourcesKey, count]`.
- IN-04: `SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000` and `startUpdateChecks(container, scriptUrl, everyMs): () => void` in `lib/sw-update.ts`. `ServiceWorkerRegistration` calls it and stops it in the effect cleanup, beside `removeEventListener`. The controllerchange logic is unchanged and `public/service-worker.js` is not edited.

## Task Commits

Ledger for 12-34 (one RED + one GREEN per finding):

| Finding | RED | GREEN |
|---------|-----|-------|
| WR-02 (Task 1, tracer) | `dafcb6e` test(12-31): the terminal observer must follow its region (WR-02) | `4312701` fix(12-31): the terminal observer follows its region (WR-02) |
| IN-03 (Task 2) | `d1c7946` test(12-31): reload textures when the sources change at the same count (IN-03) | `de25be0` fix(12-31): key the texture loader on the source URLs (IN-03) |
| IN-04 (Task 3) | `a5ff20f` test(12-31): update checks stop on unmount and catch rejections (IN-04) | `b2fb90e` fix(12-31): stop the update interval on unmount and catch update() (IN-04) |

The GREEN commits use `fix(...)`, as the plan names them (not `feat(...)`). Each RED commit comes before its GREEN commit.

## RED evidence (TDD)

Jest output is not one of the classifier's report formats (TAP / JUnit / go / swift / unittest), and `workflow.tdd_mode` is not set, so RED was checked by reading the Jest output.

- **WR-02** (`npx jest components/projects/__tests__/DemoTerminal.test.tsx`, `Tests: 2 failed, 27 passed, 29 total`):
  - `● … › follows the region when the list empties and grows again: the removed node is let go and the new one observed (WR-02)`: `expect(received).toContain(expected)`. The only live observer's target is the removed 4-command region (`· 1 / 4`), not the new 2-command one.
  - `● … › observes the region when its first commands arrive after an empty list (WR-02)`: `Expected length: 1 / Received length: 0`. No observer is created after an empty first mount.
  - Assessment: both target tests ran and failed on the planned assertions for the reason the review names. Nothing failed to load or set up.
- **IN-03** (`Tests: 1 failed, 10 passed, 11 total`): `● … › reloads when the sources change at the same count … (IN-03)`: `Expected: ArrayContaining ["b-t0.webp", "b-t1.webp"] / Received: ["f0.webp"]`. No new load was started; only the old chain's full-size request was pending. Assessment: the target test failed on its first planned assertion, for the reason the plan names.
- **IN-04** (`Tests: 6 failed, 14 passed, 20 total`): `TypeError: (0 , _swupdate.startUpdateChecks) is not a function` and `Expected: 3600000 / Received: undefined` (SW_UPDATE_INTERVAL_MS). The plan named exactly this RED reason ("startUpdateChecks does not exist"). Extra check after GREEN: with `.catch(() => {})` removed for a moment, the rejection case failed (`1 failed`), so the unhandled-rejection detector really detects. The catch was then restored.

## Verification

- Task 1: Jest DemoTerminal + demo-terminal `50 passed`; `npm run lint` exit 0; `PW_PROD=1 PW_REUSE=1 … case-study keyboard --project=chromium` **47 passed**. The tracer passed end to end, so Tasks 2 and 3 went ahead.
- Task 2: Jest `11 passed`; lint exit 0; `… photos-carousel --project=chromium` **10 passed**.
- Task 3: Jest `20 passed`; lint exit 0; `npm run type-check` exit 0; `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/service-worker.spec.ts --project=chromium` **4 passed (1.5s)** (the real worker installed and took control).
- Plan level: `npx jest --silent` **102 suites, 1691 tests passed**; lint and type-check clean. `PW_PROD=1 npx playwright test e2e/case-study.spec.ts e2e/keyboard.spec.ts e2e/photos-carousel.spec.ts e2e/service-worker.spec.ts --project=chromium --project=firefox --project=webkit` on a fresh build: first run **166 passed, 1 failed** (the A5 offline control, see Issues). The next fresh-build run gave **167 passed**.
- Acceptance: `regionRef` 0, `observeRegion` 3; DemoTerminal tests 29 (baseline 26); `sourcesKey` 6, `}, [count]);` 0; texture tests 11 (baseline 9); `setInterval` in ServiceWorkerRegistration 0, `startUpdateChecks(` 1; sw-update tests 20 (baseline 14); `git status --porcelain public/service-worker.js` prints nothing.

## Expected visual diffs

none

## Files Created/Modified

- `components/projects/DemoTerminal.tsx`: `observeRegion` callback ref, JSDoc observer line updated.
- `components/projects/__tests__/DemoTerminal.test.tsx`: the observer mock records its targets; three WR-02 cases.
- `lib/useProgressiveTextures.ts`: `sourcesKey`, tracked-key reset, `[sourcesKey, count]` deps, JSDoc now says one run per source list.
- `lib/__tests__/useProgressiveTextures.test.ts`: the equal-count reload case and the same-URLs no-reload case.
- `lib/sw-update.ts`: `SW_UPDATE_INTERVAL_MS`, `startUpdateChecks` (still import-free).
- `components/ServiceWorkerRegistration.tsx`: calls `startUpdateChecks` and stops it in the cleanup.
- `lib/__tests__/sw-update.test.ts`: the `startUpdateChecks (IN-04)` describe (6 cases, fake timers, an unhandledRejection listener).

## Decisions Made

See the key-decisions list in the frontmatter. The main one: WR-02's literal shrink path (4 → 2) is not a real removal in React 19.3. A setState during render throws away that render's `null` and re-renders before commit, so the region div is kept. The plan's literal shrink case passes at HEAD and stays as a guard. The removal does happen when the list empties (the `null` is committed), so the RED case for "observer holds a removed node" is empty-then-refill.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, test accuracy] The plan's shrink RED case could not fail at HEAD; an empty-then-refill case was added as the removed-node RED**
- **Found during:** Task 1 RED
- **Issue:** The plan expected the 4 → 2 shrink case to fail ("the live observer's target is no longer in the document"). It passed at HEAD, because React re-renders a component that calls setState during render before anything is committed, so the region node survives. That made it an unexpected GREEN for that case, and the TDD rules require an investigation.
- **Fix:** The literal shrink case stays as written: it is in the plan's behavior list and guards the fix. A third case ("follows the region when the list empties and grows again …") reproduces the real removed-node path and failed at HEAD for the review's reason.
- **Files modified:** components/projects/__tests__/DemoTerminal.test.tsx
- **Verification:** RED `2 failed, 27 passed`; GREEN `29 passed`.
- **Committed in:** dafcb6e

---

**Total deviations:** 1 auto-fixed (1 Rule 1, test accuracy)
**Impact on plan:** None on scope. DemoTerminal has 29 tests, not the 28 minimum. The Windows backslash workaround from the project notes was not needed: every check ran as a plain command or a grep without escaped regexes.

## Issues Encountered

- **One A5 offline-control failure in the first fresh-build three-engine run.** `e2e/service-worker.spec.ts:114` failed at line 136 (16 workers): `Expected: "network error" / Received: "status 200"`. The control's offline fetch reached the network, so `context.setOffline(true)` had not yet cut the worker's own fetches. The same spec passed 4/4 in the Task 3 run, and the whole 167-test command passed on the next fresh build. 12-31's change cannot reach this path: `register()` is called as before, and `update()` runs only after an hour. Logged in `deferred-items.md` (status open, watch in 12-34's CI run under `--fail-on-flaky-tests`).
- The first plan-level run left `public/service-worker.js` injected, so the second run's webServer refused to start (the inject script's placeholder guard). I restored it with `git checkout -- public/service-worker.js` and reran. The file is clean now, and no `next start` is left running on port 3000.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Ready for 12-32. The three findings' commits are in the ledger above for 12-34.
- 12-34's full three-engine CI run should watch the A5 control (deferred-items).

## Self-Check: PASSED

- All 7 modified files exist; commits dafcb6e, 4312701, d1c7946, de25be0, a5ff20f, b2fb90e are ancestors of HEAD (`git rev-list --count 9eb415b..HEAD` = 6).

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*
