---
phase: 09-home-ascent
plan: 09
subsystem: testing
tags: [playwright, visual-regression, guard-02, home-08, perf, resource-timing, lazy-chunk, d-22]

requires:
  - phase: 09-07
    provides: "data-ascent-mode on [data-ascent-stage], the next/dynamic lazy canvas chunk armed by requestIdleCallback or the first scroll"
  - phase: 09-08
    provides: "Performance mark 'ascent-canvas-ready' after the first drawn frame"
  - phase: 09-06
    provides: "e2e/helpers/webgl.ts (disableWebGL, nextFrames), e2e/helpers/ascent.ts (scrollBlockToCentre)"
  - phase: 07
    provides: "e2e/visual/routes.spec.ts harness (settle, freezeTimeAnimations, hide-canvas.css), e2e/perf/home-baseline.spec.ts and home-baseline.json (lcpMs 4692, jsTransferBytes 468770)"
provides:
  - "Home motion shots at fixed ascent positions on the static poster path: home/{375,768,1440}-ascent-{start,waypoint-2,summit}.png (constant ASCENT_SHOTS)"
  - "settle() waits for /terrain/contours-hero.<hash>.svg on /"
  - "HOME-08 perf spec: per-sample mode, initialJsTransferBytes, totalJsTransferBytes, canvasReadyMs, loadEventStartMs; result medians, modes, lateScripts, scriptTimeline; env HOME08_RUNS"
  - "HOME-08 early signal: total 441170 B with the lazy chunk, headroom 27600 B"
affects: [09-10, 09-11, 09-12, 09-13, 09-14]

actuals:
  tokens: 4800
  tasks: 2
  commits: 2
plan_head_before: 9b1879087fb22a637adc0ef81d2b3194640b505f
plan_head_after: 9cc271fd1abe162f591878e371f065707aef5a67

tech-stack:
  added: []
  patterns:
    - "Visual motion shots force static capability (disableWebGL before goto) and seek positions by centring a block, never by a scroll percentage"
    - "Perf harness counts the lazy chunk: wait for a settled data-ascent-mode, then the canvas-ready mark (or a fixed wait when static), then sum every script resource entry"

key-files:
  created: []
  modified:
    - e2e/visual/routes.spec.ts
    - e2e/visual/README.md
    - e2e/perf/home-baseline.spec.ts

key-decisions:
  - "The plan's initial/late boundary (loadEventStart) is kept as written, but on the HOME-08 profile the stage arms at about 3.1 s, before the load event, and the chunk holds the load event back (4858 ms). initialJsTransferBytes therefore equals totalJsTransferBytes and lateScripts is empty. The spec now also records loadEventStartMs per sample and the last run's full scriptTimeline, so the chunk stays visible to 09-13"
  - "No trim lever was needed: the total with the lazy chunk (441170 B) is 27600 B under the 468770 B Phase 7 baseline, beyond the 10000 B thin-margin line"
  - "The waypoint-2 selector is derived from buildWaypoints()[1].slug (it resolves to #waypoint-gornerschlucht-waterfall), never a literal"

patterns-established:
  - "A HOME-08 byte number is only trusted together with its mode ('3d') and the scriptTimeline showing the chunk files"

requirements-completed: [HOME-08]

coverage:
  - id: D1
    description: "Home motion shots capture fixed ascent positions (top, waypoint 2 centred, summit centred) at 375/768/1440 px on the static poster path, as home/{w}-ascent-{start,waypoint-2,summit}.png; the visual list stays at 36 tests per project with no 'home scroll' title"
    requirement: HOME-08
    verification:
      - kind: other
        ref: "npx playwright test --list --project=visual-dark (Total: 36 tests; 0 'home scroll'); same for visual-light"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/visual/routes.spec.ts --project=visual-dark -g home --update-snapshots=none (12/12 fail only with 'A snapshot doesn't exist'; no settle timeout, no snapshot written)"
        status: pass
    human_judgment: true
    rationale: "The comparison itself needs Linux baselines, which Tim captures in the CI container at 09-14; the local run proves the shots settle and capture, and one capture was inspected by eye (waypoint 2 centred, pin 2 active, rail 1,668 m)"
  - id: D2
    description: "HOME-08 perf spec records mode, initialJsTransferBytes, totalJsTransferBytes, canvasReadyMs, loadEventStartMs, medians, lateScripts and scriptTimeline; legacy jsTransferBytes kept; HOME08_RUNS honoured; total >= initial asserted"
    requirement: HOME-08
    verification:
      - kind: e2e
        ref: "PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf (1 passed)"
        status: pass
      - kind: other
        ref: "node early-signal check from the plan's verify block (exit 0: initial 441170, total 441170, headroom 27600, mode 3d)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Which HOME-08 number gates (total vs initial), given that the plan's load-event boundary puts the lazy chunk in 'initial' on this profile"
    requirement: HOME-08
    verification: []
    human_judgment: true
    rationale: "Tim decides the gate at the blocking checkpoint 09-13 Task 3 from the CI container numbers; this plan only measures"

duration: 7min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 09: Visual and perf harnesses for the ascent Summary

**The Home motion baselines now capture three fixed ascent positions (top, waypoint 2 centred, summit centred) on the static poster path, with WebGL switched off and `settle()` waiting for the hero contour SVG. The HOME-08 perf spec now counts the lazy canvas chunk. The first local production measurement puts Home at 441,170 B of script with the chunk loaded (mode `3d`), 27,600 B under the Phase 7 baseline of 468,770 B.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-25T01:34:21Z
- **Completed:** 2026-10-25T01:41:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `routes.spec.ts`: `SCROLL_PCTS` is replaced by `ASCENT_SHOTS`. Each Home motion test calls `disableWebGL` before `goto` and keeps `reducedMotion: 'no-preference'`. It settles, then scrolls to the top or centres the block with `scrollBlockToCentre`, freezes time animations and shoots `['home', '<w>-ascent-<shot>.png']` with `animations: 'allow'`. The reduced full-page loop is unchanged. There are still 36 tests per visual project.
- `settle()` waits for the `/terrain/contours-hero.<10 hex>.svg` resource on `/` after the strip wait. Other routes pass through on the pathname check.
- `README.md` describes the three ascent positions, the forced poster path and the hidden canvases, and states that the 3D path is covered by `e2e/home-canvas.spec.ts`.
- `home-baseline.spec.ts` keeps PROFILE, the throttling, the LCP observer, the legacy fields and every assertion. Each sample now also records:
  - its settled mode, waiting at most 20 s;
  - the 'ascent-canvas-ready' time in `3d`, or a 10 s wait in a static mode;
  - initial and total script bytes, and loadEventStart.

  The result adds the medians, `modes`, `lateScripts` and `scriptTimeline`. `HOME08_RUNS` defaults to 5, and the test timeout scales with it.

## Task Commits

1. **Task 1 (tracer): Home visual shots at fixed ascent positions on the poster path**: `2b43e1d` (test)
2. **Task 2: HOME-08 perf spec measures the lazy canvas chunk**: `9cc271f` (test)

## Tracer gate
This was an interactive run (`_auto_chain_active` false) in `end-of-phase` mode, and the `<verify>` is automated-only. The verify had passed on the committed code: 36 listed tests, no "home scroll" title, and 12/12 Home runs failing only on a missing snapshot. I then moved on to Task 2.

## HOME-08 early signal

Local production build (`PW_PROD=1`, `next start`, gzip as in the container), one run on the HOME-08 profile, mode `3d`, `canvasReadyMs` 5927. The LCP of 3064 ms is local and not comparable to the container. The byte counts are comparable.

| Metric | Bytes |
|---|---|
| initialJsTransferBytes (startTime < loadEventStart) | 441,170 |
| totalJsTransferBytes (after 'ascent-canvas-ready') | 441,170 |
| Lazy bytes as the plan defines them (total − initial) | 0 |
| Lazy chunk as actually loaded (3 files, below) | 260,010 |
| Page scripts from the HTML (12 files) + Vercel insights (600) | 181,160 |
| Headroom to 468,770 B | **27,600** |
| Legacy jsTransferBytes at load + 3 s | 441,170 |

**lateScripts:** `[]` (empty). The canvas chunk did not start after the load event. The stage armed at about 3.1 s through `requestIdleCallback`, while the hillshade image was still downloading. The inserted chunk scripts then held the load event until they finished (loadEventStart 4858 ms, three/R3F responseEnd about 4684 ms). By the plan's boundary they count as initial. The last run's `scriptTimeline` shows the chunk. I matched each file to its contents in `.next/static/chunks`:

| startTime (ms) | Transfer (B) | File | Contents |
|---|---|---|---|
| 3159 | 474 | `/_next/static/chunks/0mb_2tczmnc8p.js` | Turbopack re-export stub |
| 3160 | 241,953 | `/_next/static/chunks/20qursic9hj_2.js` | three + R3F (`WebGLRenderer`), 904,469 B raw |
| 3161 | 17,583 | `/_next/static/chunks/0c7xoevl4g9ua.js` | TerrainMesh, shader, fast-png, `ascent-canvas-ready` |

The chunk measures 260,010 B, against RESEARCH A2's estimate of 240-260 KB gz. No trim lever was needed:
- The total is under 468,770 B.
- The 27,600 B headroom is more than 10,000 B, so this is not "HOME-08 margin thin".
- `npm ls three` shows a single three@0.184.0 on the Home path. The one nested three@0.170.0 sits under `stats-gl`, which only drei reaches, and no Home script loads drei.
- The `git grep` for `three/examples`, `three/webgpu` and `@react-three/drei` in `components/home` and `lib` prints nothing.

09-10 and 09-11 add code to the chunk (route camera, pins, frame sampler). 09-12 Task 3 measures again.

## Files Created/Modified
- `e2e/visual/routes.spec.ts`: `ASCENT_SHOTS`, the poster-path motion loop and the hero contour wait.
- `e2e/visual/README.md`: the ascent positions and where the 3D path is covered.
- `e2e/perf/home-baseline.spec.ts`: mode, initial and total bytes, canvas-ready time, load-event time, late scripts and the script timeline.
- `.planning/phases/09-home-ascent/deferred-items.md`: the load-event observation for 09-13.

## Decisions Made
See key-decisions. The main one is to keep the plan's initial/late boundary and add the raw timeline beside it, rather than redefine the metric that Tim chooses the gate from.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The perf JSON could not show the lazy chunk under the plan's boundary**
- **Found during:** Task 2, first production run (`lateScripts: []`, initial equal to total, mode `3d`)
- **Issue:** The plan defines initial as scripts that started before `loadEventStart` and `lateScripts` as "the lazy chunk files". On this profile the stage arms before the load event, and the chunk holds that event back, so the chunk counts as initial. Without more data, a recorded result could not show whether the chunk loaded or how big it was (threat T-09-14, repudiation).
- **Fix:** Both plan fields stay as written. Two additive fields join them: `loadEventStartMs` on each sample, and `scriptTimeline` on the result (every script of the last run with name, transfer size and start time). The spec's doc comment explains the case.
- **Files modified:** e2e/perf/home-baseline.spec.ts
- **Verification:** a second `PW_PROD=1` run passed and lists the three chunk files at 3159-3161 ms with loadEventStartMs 4858. A separate probe against `next start` gave the same timeline.
- **Committed in:** `9cc271f`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** additive measurement data only. The plan's fields, profile and assertions are unchanged, and there is no scope creep in product code.

## Issues Encountered
- The plan expects the lazy bytes to appear as total − initial. On this profile they read 0, for the reason above. The observation is logged in deferred-items.md for the 09-13 gate choice: "gate on initial bytes" currently measures the same thing as total. Arming after `load`, or an arm mark, would change that, but either one is a product change outside this plan.
- A first attempt at the Task 1 edit through a quoted `node -e` script failed on shell quoting before writing anything. I made the edits with the Edit tool instead.

## Verification
- `npx playwright test --list --project=visual-dark`: 36 tests (visual-light also 36). There are 0 "home scroll" titles, and the 9 new ones are `home ascent {start,waypoint-2,summit} @{375,768,1440}`.
- Home visual run (dev server, `--update-snapshots=none`): all 12 failures read "A snapshot doesn't exist". There was no settle timeout or missing selector. `git status --short e2e/visual/routes.spec.ts-snapshots` is empty.
- `npx playwright test --list --project=perf`: 1 test. The production run passed, and the early-signal node check exited 0.
- Acceptance greps: `ascent-waypoint-2\|ascent-${` 1, `SCROLL_PCTS` 0, `contours-hero` 1, `totalJsTransferBytes` 6, `jsTransferBytes: js.transfer` 1. `git diff --stat HEAD -- e2e/perf/home-baseline.json` and `git status --short public/service-worker.js` are both empty.
- I type-checked both specs through a scratchpad tsconfig, because `e2e/` is excluded from the project's tsconfig, and got no errors. ESLint is clean on both. `guard:tests` gives jest 590 + e2e 168 = 758 (baseline 533), OK.
- Nothing was pushed and no workflow was dispatched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 09-10 and 09-11 can build on the chunk. HOME-08 has 27.6 KB of headroom on total bytes.
- 09-13: the CI perf run records `mode`, `scriptTimeline` and `loadEventStartMs`. Check the mode is `3d` before trusting a byte number. Tim's gate choice should take into account that "initial" includes the chunk on this profile (deferred-items.md).
- 09-14: Tim re-captures the 9 `home/*-ascent-*` baselines and deletes the 9 obsolete `home/*-scroll-*` PNGs (`check-snapshot-commit --allow home --allow-deletions`).

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

All 3 modified files exist. Commits 2b43e1d and 9cc271f are ancestors of HEAD (`git rev-list --count 9b18790..HEAD` = 2).
