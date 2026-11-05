---
phase: 07-foundation-guardrails
plan: 26
subsystem: infra
tags: [home-08, perf, lcp, js-bytes, playwright-project, test-count, ratchet, guard-03, dependabot, phase-close, build-step-10]

requires:
  - phase: 07-25
    provides: "Identity guard and emoji rule commits (168f176, 44612f3), CI-verified by this plan's ci/07-26 push"
  - phase: 07-03
    provides: "visual-baselines.yml with the suite perf step and the Playwright container job"
  - phase: 07-01
    provides: "test-count.mjs ratchet (baseline 91) and the Phase 7 Dependabot holds"
provides:
  - "Playwright project `perf` (testMatch PERF = /perf\\/.*\\.spec\\.ts$/, retries 0, serviceWorkers block); PERF excluded from chromium, firefox and webkit; visual projects unchanged"
  - "e2e/perf/home-baseline.spec.ts: 'home mobile LCP + JS bytes', 5 fresh Pixel 7 contexts, 4x CPU, 150 ms / 200000 B/s down / 93750 B/s up, medians written to HOME08_OUT"
  - "e2e/perf/home-baseline.json: HOME-08 baseline recorded in mcr.microsoft.com/playwright:v1.64.0-noble at b21dbc9: lcpMs 4692, jsTransferBytes 468770, jsDecodedBytes 1625352"
  - "visual-baselines.yml suite-perf step sets PW_CONTAINER_TAG to the job image (parity-guarded)"
  - "scripts/guards/test-count.baseline.json raised 91 -> 206 (jest 107 + e2e 99)"
  - ".github/dependabot.yml back to the pre-07-01 file: next/react/react-dom ignore semver-major only; the eight temporary holds are gone"
affects: [08, 09]

actuals:
  tokens: 2968    # chars/4 over `git diff 4705a3b..8eddb50` (11872 chars: spec, config, workflow, baseline JSON, ratchet, dependabot)
  tasks: 3
  commits: 3      # measured: git rev-list --count 4705a3b..HEAD = 3 (b21dbc9, 38b9704 by Tim, 8eddb50), before the docs commits
plan_head_before: 4705a3b6c859f6bc3882d925325196190ec9054e
plan_head_after: 8eddb509dff8709e28d8e239f2baa19b80d57fe5

tech-stack:
  added: []
  patterns:
    - "Lab perf numbers are recorded only in the CI Playwright container and committed by hand; a baseline carries its commit, Playwright and browser version, container tag and throttling profile so later runs compare like for like"
    - "On-demand Playwright projects are excluded from the functional projects by testIgnore and selected by testMatch, so the test-count guard sees the spec once without any functional run executing it"

key-files:
  created:
    - e2e/perf/home-baseline.spec.ts
    - e2e/perf/home-baseline.json
  modified:
    - playwright.config.ts
    - .github/workflows/visual-baselines.yml
    - scripts/guards/test-count.baseline.json
    - .github/dependabot.yml

key-decisions:
  - "HOME-08 baseline for Phase 9 (Home, Pixel 7, 4x CPU, 150 ms, 200000/93750 B/s, 5 runs, medians, container mcr.microsoft.com/playwright:v1.64.0-noble, Playwright 1.64.0, Chromium 156.0.8078.4, commit b21dbc9): LCP 4692 ms, script transfer 468770 B, script decoded 1625352 B. Phase 9 must re-measure with the same perf project in the same container and must not exceed these"
  - "test-count ratchet raised at phase close from 91 to 206 (jest 107 + e2e 99, unique file::title keys across all Playwright projects incl. perf); Phase 8 ratchets from 206"
  - "Dependabot restored to the exact pre-07-01 file (git diff against ebb8c74~1 is empty): next/react/react-dom ignore semver-major only; motion, framer-motion, @types/react, @types/react-dom, @react-three/fiber, @react-three/drei, @playwright/test and eslint-config-next flow again (check-install-parity fails a @playwright/test bump without the matching container tag)"

patterns-established:
  - "Perf harness failures are loud: a missing LCP entry falls back to NaN after 5 s so the finite-LCP assertion fails instead of the test hanging"

# Copied verbatim from the PLAN's `requirements`.
requirements-completed: [GUARD-03]

coverage:
  - id: D1
    description: "perf project runs the Home harness on demand only and is excluded from chromium/firefox/webkit and visual runs"
    requirement: GUARD-03
    verification:
      - kind: command
        ref: "npx playwright test --list --project=perf -> Total: 1 test in 1 file; chromium/firefox/webkit/visual lists contain no perf line"
        status: pass
    human_judgment: false
  - id: D2
    description: "e2e/perf/home-baseline.json recorded in the CI Playwright container with commit, versions, container tag and profile"
    requirement: GUARD-03
    verification:
      - kind: command
        ref: "Update visual baselines suite=perf run 40044127668 artifact home-baseline; node check 'HOME-08 baseline OK 4692 468770'"
        status: pass
      - kind: human
        ref: "Tim reviewed and committed 38b9704"
        status: pass
    human_judgment: true
  - id: D3
    description: "test-count baseline raised, never lowered, total = jest + e2e"
    requirement: GUARD-03
    verification:
      - kind: command
        ref: "test-count.mjs --update -> 'jest 107 + e2e 99 = 206 (baseline 91)', OK; plan verify printed 'ratchet 91 -> 206'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Dependabot holds removed; next/react/react-dom back to major-only ignores"
    requirement: GUARD-03
    verification:
      - kind: command
        ref: "plan verify printed 'dependabot restored' (no 'Phase 7', 3 semver-major entries); js-yaml load OK"
        status: pass
    human_judgment: false

duration: 20 min (ledger 4705a3b at 00:10:29Z to the Task 3 commit 8eddb50 at 00:29:56Z, including the CI perf run and Tim's checkpoint)
completed: 2026-10-24
status: complete
---

# Phase 7 Plan 26: HOME-08 baseline, test-count ratchet and Dependabot restore (build step 10, phase close)

**Phase 9 now has a like-for-like target: Home on an emulated Pixel 7 (4x CPU, 150 ms, 1.6 Mbps down) in the CI Playwright container has a median LCP of 4692 ms and loads 468770 B of script over the wire (1625352 B decoded). The harness is an on-demand `perf` Playwright project that no functional or visual run executes. The test-count ratchet starts Phase 8 at 206 (from 91), and Dependabot is back to the pre-Phase-7 config.**

## Performance

- **Duration:** 20 min from the ledger (`4705a3b`, 00:10:29Z) to the Task 3 commit (`8eddb50`, 00:29:56Z), including the CI perf run and Tim's checkpoint.
- **Tasks:** 3/3 (Task 1 tracer, Task 2 checkpoint:human-action, Task 3 auto)
- **Files modified:** 6 (2 created, 4 modified)

## HOME-08 baseline (e2e/perf/home-baseline.json)

| Field | Value |
|-------|-------|
| `lcpMs` (median of 5) | **4692** |
| `jsTransferBytes` (median) | **468770** |
| `jsDecodedBytes` (median) | **1625352** |
| LCP samples (ms) | 4264, 4748, 4692, 4700, 4688 |
| Script bytes per sample | identical in all 5 runs |
| Profile | Pixel 7, CPU slowdown 4, latency 150 ms, download 200000 B/s, upload 93750 B/s |
| Container | `mcr.microsoft.com/playwright:v1.64.0-noble` |
| Playwright / browser | 1.64.0 / Chromium 156.0.8078.4 |
| Commit | `b21dbc99a6f407545db6e5907feef95922f721bc` |
| Recorded | 2026-10-24T00:19:39Z, "Update visual baselines" suite=perf run 40044127668, artifact `home-baseline` |

A local Windows run (not the baseline) gave LCP 4104 ms with the same script bytes, which shows why only container numbers count.

## Accomplishments

- **Perf project (Task 1):** `playwright.config.ts` adds `const PERF = /perf\/.*\.spec\.ts$/`, puts it in `testIgnore: [VISUAL, PERF]` for chromium, firefox and webkit, and adds project `perf` (`testMatch: PERF`, `retries: 0`, Desktop Chrome, `serviceWorkers: 'block'`). The visual projects still use `testMatch: VISUAL`.
- **Harness:** `e2e/perf/home-baseline.spec.ts`, one test `home mobile LCP + JS bytes`. Each of 5 runs opens a fresh Pixel 7 context with service workers blocked, applies `Emulation.setCPUThrottlingRate` 4 and `Network.emulateNetworkConditions` over CDP, loads `/`, waits 3 s, reads the last buffered `largest-contentful-paint` entry and sums `transferSize` and `decodedBodySize` of script resources. Medians and samples go to `HOME08_OUT` (default `test-results/home-baseline.json`, the workflow's upload path).
- **Workflow:** the suite-perf step in `visual-baselines.yml` sets `PW_CONTAINER_TAG: mcr.microsoft.com/playwright:v1.64.0-noble`, which the parity guard checks against the lockfile.
- **Ratchet (Task 3, GUARD-03):** `test-count.mjs --update` raised the baseline from **91** (jest 66 + e2e 25, recorded 2026-10-10 at c3de44d) to **206** (jest 107 + e2e 99, recorded 2026-10-24 at 38b9704). The guard refuses to lower it.
- **Dependabot (Task 3):** removed the `# Phase 7 temporary holds` block and its eight entries (motion, framer-motion, @types/react, @types/react-dom, @react-three/fiber, @react-three/drei, @playwright/test, eslint-config-next), and gave next, react and react-dom back `update-types: ["version-update:semver-major"]` without the "Phase 7 hold" comments. The result is byte-identical to the file before 07-01 (`git diff ebb8c74~1 -- .github/dependabot.yml` is empty). The 6 + 12 lines became 6 lines (diffstat +6 / -12).

## Task Commits

1. **Task 1 (tracer): HOME-08 perf harness**: `b21dbc9` `test(07-26): HOME-08 perf harness (perf project)`.
   - Tracer gate: automated verify re-run green (perf lists 1 test; no perf line in chromium; lint 0 errors; jest 107/107; guard:tests 206 against baseline 91).
2. **Task 2 (checkpoint:human-action): baseline recorded in the container**: `38b9704` `test(07-26): HOME-08 Home mobile LCP + JS baseline` (committed by Tim, file only).
3. **Task 3 (auto): phase close**: `8eddb50` `chore(07-26): phase 7 close - raise test-count baseline, restore Dependabot`.

`git rev-list --count 4705a3b..HEAD` = 3, measured from the plan ledger. This plan pushed only `ci/07-26` (orchestrator, plain new branch at b21dbc9). Nothing else was pushed and no PNG was touched.

## CI evidence

| Run | Ref | Result |
|-----|-----|--------|
| 40044127837 (CI) | ci/07-26 @ b21dbc9 (also covers the 07-25 commits 168f176, 44612f3) | all jobs success: Lint and Type Check, E2E, Visual (no diff), Unit, Build |
| 40043694321 (CI) | ci/07-25 @ 4705a3b | all success; E2E 122 passed, 0 flaky |
| 40044127668 (Update visual baselines, suite perf) | ci/07-26 @ b21dbc9 | success; artifact `home-baseline` -> `e2e/perf/home-baseline.json` |
| `check-visual-run.mjs --sha b21dbc9` (Lint and Type Check; Visual) | HEAD~1 at Task 2 | PASS |

`8eddb50` (ratchet + dependabot) has not been through CI; the local suite below covers it.

## Check outputs (Task 3)

| Check | Result |
|-------|--------|
| Ratchet verify (against committed HEAD baseline) | `ratchet 91 -> 206` |
| Dependabot verify | `dependabot restored` (no "Phase 7", exactly 3 `version-update:semver-major`) |
| `js-yaml` load of dependabot.yml | OK; `updates[0].ignore` = next, react, react-dom, each `["version-update:semver-major"]` |
| `npm run lint` | exit 0: eslint 0 errors, 54 warnings (pre-existing, untouched files); parity, palette, contrast, identity OK; selftest 55/55 |
| `npm run type-check` | exit 0 |
| `npm test` | 13 suites, 107/107 passed |
| `npm run build` | exit 0 (9 routes + proxy); `public/service-worker.js` restored with `git checkout --` |
| `jest-results.json` | gitignored (`.gitignore:15`), never staged |

## Files Created/Modified

- `e2e/perf/home-baseline.spec.ts`: new HOME-08 harness.
- `e2e/perf/home-baseline.json`: new baseline (Tim's commit).
- `playwright.config.ts`: `PERF` constant, testIgnore on the functional projects, `perf` project.
- `.github/workflows/visual-baselines.yml`: `PW_CONTAINER_TAG` on the suite-perf step, comment updated.
- `scripts/guards/test-count.baseline.json`: 91 -> 206.
- `.github/dependabot.yml`: holds removed, major-only ignores restored.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues (Task 1 harness)

**1. [Rule 3 - Blocking] Explicit baseURL on the hand-made Pixel 7 contexts**
- **Issue:** `browser.newContext({ ...devices['Pixel 7'] })` does not inherit the project's `baseURL`, so `goto('/')` would fail.
- **Fix:** the context takes `baseURL` from `testInfo.project.use.baseURL`.
- **Commit:** `b21dbc9`.

**2. [Rule 1 - Correctness] `Network.enable` before `Network.emulateNetworkConditions`**
- **Issue:** without the domain enabled, Chromium can ignore the throttling and the numbers would not reflect the profile.
- **Commit:** `b21dbc9`.

**3. [Rule 2 - Robustness] 5 s LCP fallback to NaN**
- **Issue:** a page that never emits an LCP entry would hang the observer promise.
- **Fix:** after 5 s the read resolves NaN, so the finite-LCP assertion fails loudly.
- **Commit:** `b21dbc9`.

**4. [Note] Extra fields and resolution details**
- The JSON carries an extra `browserVersion` key (additive). `playwrightVersion` is read from `node_modules/@playwright/test/package.json`. `HOME08_OUT` resolves relative to the config directory, so the default matches the workflow upload path.

### Task 3

None. The Dependabot edit restores the pre-07-01 file exactly.

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 correctness, 1 robustness) and 1 note, all in Task 1.
**Impact on plan:** no scope change.

## Issues Encountered

None.

## User Setup Required

None. Tim pushes the phase branch / main when ready to deploy the phase.

## Next Phase Readiness

- All 26 Phase 7 plans are executed; phase verification is next (orchestrator).
- Phase 8 starts with the ratchet at 206. Phase 9 (HOME-08) compares against 4692 ms LCP and 468770 B script transfer, measured with `--project=perf` in the same container.
- Resumed Dependabot PRs may arrive from the next Monday run; a @playwright/test bump must also bump the container tag (parity guard).

## Self-Check: PASSED

- FOUND: e2e/perf/home-baseline.spec.ts, e2e/perf/home-baseline.json, playwright.config.ts, .github/workflows/visual-baselines.yml, scripts/guards/test-count.baseline.json, .github/dependabot.yml
- FOUND: b21dbc9, 38b9704, 8eddb50 (ancestors of HEAD)
- Task 3 acceptance criteria re-run PASS (ratchet verify, dependabot verify, full local suite)
