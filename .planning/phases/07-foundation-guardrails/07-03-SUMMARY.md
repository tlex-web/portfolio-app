---
phase: 07-foundation-guardrails
plan: 03
subsystem: testing
tags: [playwright, visual-regression, screenshots, github-actions, workflow_dispatch, baselines, guards]

requires:
  - phase: 07-01
    provides: "install-parity guard (container tag = lockfile @playwright/test), test-count ratchet, guard selftest table"
  - phase: 07-02
    provides: "npm run lint = eslint . + guard:parity + guard:selftest, green at 0 errors"
provides:
  - "Playwright projects visual-dark / visual-light (Chromium, colorScheme dark/light, retries 0, serviceWorkers block), testMatch VISUAL; functional projects testIgnore VISUAL"
  - "e2e/visual/routes.spec.ts: 9 routes x 3 widths full-page reduced-motion shots + Home 0/50/100% scroll shots with motion on (36 per scheme, 72 total)"
  - "e2e/visual/hide-canvas.css: canvases hidden via stylePath, hero scroll arrow pinned"
  - ".github/workflows/visual-baselines.yml: workflow_dispatch only, contents: read, runs in mcr.microsoft.com/playwright:v1.60.0-noble, uploads the visual-baselines artifact"
  - "scripts/ci/check-visual-run.mjs (evaluate): reads the CI 'Visual Regression' job result for a SHA from the public GitHub API"
  - "scripts/ci/check-snapshot-commit.mjs (evaluateSnapshotChanges): checks a commit's PNG set against an allow-list; rejects non-linux PNGs"
  - "e2e/visual/README.md: zero-diff gate and intentional re-baseline protocol"
  - "72 committed -linux.png baselines under e2e/visual/routes.spec.ts-snapshots/ (Playwright 1.60.0)"
  - "CI e2e job limited to --project=chromium --project=firefox; ci/** branches trigger CI"
affects: [07-04, 07-05, 07-06, 07-07, 07-08, 07-14, 07-26, phase-9, phase-10, phase-11, phase-12]

actuals:
  tokens: 9112
  tasks: 3
  commits: 4
plan_head_before: 4f06461fbd8373e5a992afc63823b70fcbf5bb62
plan_head_after: bce028f8fba0cfeaf56fb8451ac90882f6440b29

tech-stack:
  added: []
  patterns:
    - "Visual specs live in e2e/visual/ and run only in the visual-* projects; snapshot names are explicit arrays [route, `${w}-${mode}.png`]"
    - "Baselines come only from the workflow_dispatch job in the official Playwright container; Tim downloads, reviews and commits them by hand"
    - "Scroll-driven (ViewTimeline) animations are ignored when waiting for animations to settle; scroll shots finish/cancel time-based animations and shoot with animations: 'allow'"
    - "Infinite rAF-driven animations Playwright cannot freeze are pinned in hide-canvas.css"
    - "Plan verification of a baseline commit uses per-slug --allow, never --allow-all (which turns off the folder check)"

key-files:
  created:
    - e2e/visual/routes.spec.ts
    - e2e/visual/hide-canvas.css
    - e2e/visual/README.md
    - .github/workflows/visual-baselines.yml
    - scripts/ci/check-visual-run.mjs
    - scripts/ci/check-snapshot-commit.mjs
    - scripts/guards/__selftest__/visual-run/runs.json
    - scripts/guards/__selftest__/visual-run/runs-no-ci.json
    - scripts/guards/__selftest__/visual-run/jobs-pass.json
    - scripts/guards/__selftest__/visual-run/jobs-fail.json
    - scripts/guards/__selftest__/visual-run/jobs-pending.json
    - scripts/guards/__selftest__/visual-run/jobs-no-visual.json
    - e2e/visual/routes.spec.ts-snapshots/** (72 PNGs)
  modified:
    - playwright.config.ts
    - .github/workflows/ci.yml
    - scripts/guards/selftest.mjs
    - .gitignore

key-decisions:
  - "Baselines are captured only by the workflow_dispatch job in mcr.microsoft.com/playwright:v1.60.0-noble from a production build; the workflow holds contents: read and only uploads an artifact; Tim commits baselines by hand"
  - "Snapshot-commit verifications in later plans use per-slug --allow (e.g. --allow photos); --allow-all disables the routes.spec.ts-snapshots/<slug>/ folder check and let a misplaced folder through once"
  - "The visual compare job is not added to CI in this plan; it lands in 07-04 now that baselines exist, so main is never red"
  - "Scroll-driven animations (ViewTimeline) are excluded from the settle wait, and scroll shots use freezeTimeAnimations() + animations: 'allow', because Playwright's animations: 'disabled' cancels them"

patterns-established:
  - "Zero-diff gate: executor commits, Tim pushes to ci/07-NN, executor runs check-visual-run.mjs --wait 30 (exit 0) and check-snapshot-commit.mjs --none"
  - "Intentional re-baseline: Tim runs Update visual baselines on ci/07-NN, unzips the artifact's contents directly into routes.spec.ts-snapshots/, amends; executor checks the changed set with per-slug --allow and the green CI run"

requirements-completed: [GUARD-02]

coverage:
  - id: D1
    description: "visual-dark / visual-light projects list exactly 72 tests from one file; functional chromium/firefox projects list none of them"
    requirement: GUARD-02
    verification:
      - kind: other
        ref: "npx playwright test --list --project=visual-dark --project=visual-light -> 'Total: 72 tests in 1 file'"
        status: pass
      - kind: other
        ref: "npx playwright test --list --project=chromium | grep -c visual/routes.spec.ts -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Baseline workflow is workflow_dispatch only, contents: read, pinned to the lockfile Playwright container, never pushes/commits/opens PRs"
    requirement: GUARD-02
    verification:
      - kind: other
        ref: "Task 2 node workflow-permissions check -> 'workflow permissions OK'"
        status: pass
      - kind: other
        ref: "node scripts/guards/check-install-parity.mjs (inside npm run lint) -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-visual-run.mjs and check-snapshot-commit.mjs report the four CI outcomes and every snapshot rule, proven able to fail"
    requirement: GUARD-02
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs (visual-run evaluate cases + snapshot-commit rule cases) -> 24/24"
        status: pass
      - kind: other
        ref: "check-snapshot-commit.mjs on HEAD~ (516c90c) with 'home' dropped from --allow -> FAIL lines, exit 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "72 -linux.png baselines committed in e2e/visual/routes.spec.ts-snapshots/, names exactly matching the spec's matrix"
    requirement: GUARD-02
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 516c90c --some --allow <9 slugs> -> OK (72 changed), exit 0; --allow-all form also exit 0"
        status: pass
      - kind: other
        ref: "git ls-files diffed against the generated 9x3x2 reduced + 3x3x2 home-scroll name list -> EXACT MATCH (72); 36 dark, 36 light, 0 non-linux, all valid PNG headers"
        status: pass
    human_judgment: false
  - id: D5
    description: "Each baseline shows a correctly rendered page (no blank page, canvases hidden, fonts loaded, 404 shows v1 not-found copy)"
    verification: []
    human_judgment: true
    rationale: "Rendering quality of the PNGs was reviewed by Tim before he committed them (Task 3 step 4); no automated check judges page content"

duration: 45min
completed: 2026-10-10
status: complete
---

# Phase 7 Plan 03: Visual-regression harness and initial Linux baselines (GUARD-02) Summary

**Playwright now has `visual-dark` / `visual-light` projects that screenshot 9 routes at 375/768/1440 px plus Home at 0/50/100% scroll with motion on, at zero pixel tolerance. A read-only `workflow_dispatch` job in the `playwright:v1.60.0-noble` container produces the baselines, and two dependency-free helpers check CI results and a commit's PNG set. Tim generated, reviewed and committed all 72 `-linux.png` baselines by hand.**

## Performance

- **Duration:** 45 min wall-clock, including two human checkpoint round-trips (the executor work itself was much shorter)
- **Started:** 2026-10-10T20:21:44Z
- **Completed:** 2026-10-10T21:06:30Z
- **Tasks:** 3/3
- **Files modified:** 88 (16 text files, 72 PNGs)

## Accomplishments
- GUARD-02: every route (`/`, `/photos`, `/projects`, `/projects/clix-cli`, `/projects/clix-website`, `/roadmap`, `/contact`, `/offline`, an unknown URL) has dark and light baselines at three widths. Home also has motion-on viewport shots at 0/50/100% scroll, which cover the `useScroll` paths that reduced-motion shots cannot see.
- `playwright.config.ts`: `updateSnapshots: 'none'` under CI, so a missing PNG fails. `PW_PROD` / `CI` switch the web server to `next build && next start`. Firefox gets `grepInvert: /@chromium-only/`. `DARK_PATH` is defined for plan 07-14.
- `.github/workflows/visual-baselines.yml`: inputs `suite` (visual|perf) and `update_mode` (changed|all), passed to the shell only through `env`. It uploads `visual-baselines` (or `home-baseline` for perf) and holds `contents: read`.
- `check-visual-run.mjs` and `check-snapshot-commit.mjs` give later plans a scripted zero-diff gate and re-baseline check. Selftest grew from 12 to 24 cases.
- CI's e2e job now runs only `chromium` + `firefox`, and `ci/**` pushes trigger CI for the gate protocol.

## Task Commits

1. **Task 1 (tracer): Visual projects and the route matrix spec** - `c28bddb` (feat)
2. **Task 2: Baseline workflow, CI-status and snapshot-commit helpers, protocol README, e2e job limited to functional projects** - `2c4e106` (feat)
3. **Task 3: Initial Linux baselines (Tim, by hand)** - `516c90c` (test, authored by tlex-web; amended from 729706c to fix the folder)
4. **README clarification after the misplaced-folder incident** - `bce028f` (docs)

**Plan metadata:** see the final docs commit

## Files Created/Modified
- `playwright.config.ts` - `VISUAL`, `DARK_PATH`, `prod`; visual-dark/visual-light projects; `testIgnore: VISUAL` on functional projects; `updateSnapshots` and `toHaveScreenshot` defaults
- `e2e/visual/routes.spec.ts` - `ROUTES`, `WIDTHS`, `settle()`, `freezeTimeAnimations()`; 27 reduced full-page tests + 9 Home scroll tests per scheme
- `e2e/visual/hide-canvas.css` - `canvas { visibility: hidden !important; }` plus the hero arrow pin
- `e2e/visual/README.md` - rules, zero-diff gate, intentional re-baseline, local-run notes
- `e2e/visual/routes.spec.ts-snapshots/<route>/*.png` - 72 baselines
- `.github/workflows/visual-baselines.yml` - the baseline generator
- `.github/workflows/ci.yml` - `'ci/**'` push branches; e2e run line `npx playwright test --project=chromium --project=firefox`
- `scripts/ci/check-visual-run.mjs` - exports `evaluate`; CLI `--sha --job --workflow --wait`
- `scripts/ci/check-snapshot-commit.mjs` - exports `evaluateSnapshotChanges`; CLI `--sha --allow --allow-all --allow-deletions --none --some`
- `scripts/guards/selftest.mjs` + `scripts/guards/__selftest__/visual-run/*.json` (6 fixtures) - visual-run outcome and snapshot-commit rule cases, plus a no-spawn `{ name, fn }` case kind
- `.gitignore` - ignores `e2e/**/*-win32.png` and `e2e/**/*-darwin.png`

## Decisions Made
- The CI visual compare job is deferred to 07-04, as planned, so main never runs a compare without baselines.
- Later plans must verify baseline commits with per-slug `--allow`. The plan's literal `--allow-all` form skips the folder check, which is how the first misplaced commit would have passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `settle()` hung on Home with motion on**
- **Found during:** Task 1
- **Issue:** Motion's `useScroll` uses a ViewTimeline, and those animations report `running` at every scroll position, so "wait until no finite animation is running" never ended.
- **Fix:** The animation wait only considers animations with `a.timeline === document.timeline`.
- **Files modified:** e2e/visual/routes.spec.ts
- **Verification:** Local 72-shot smoke run completed and was pixel-stable across 2 runs
- **Committed in:** `c28bddb`

**2. [Rule 1 - Bug] `animations: 'disabled'` cancelled scroll-driven animations**
- **Found during:** Task 1
- **Issue:** Playwright's `animations: 'disabled'` cancels scroll-driven animations because their end time is a percentage. The scroll shots would then show the un-scrolled state, which defeats their purpose.
- **Fix:** The scroll shots call `freezeTimeAnimations()` (finishes finite time-based animations, cancels infinite ones) and shoot with `animations: 'allow'`.
- **Files modified:** e2e/visual/routes.spec.ts
- **Verification:** Scroll shots stable across 2 local runs
- **Committed in:** `c28bddb`

**3. [Rule 1 - Bug] Unstable scroll-0 shots from the bouncing hero arrow**
- **Found during:** Task 1
- **Issue:** The hero "Scroll to explore" arrow bounces forever via requestAnimationFrame, which Playwright cannot freeze.
- **Fix:** `hide-canvas.css` pins it: `div:has(> svg > path[d='M19 14l-7 7m0 0l-7-7m7 7V3']) { transform: none !important; }`. The rule goes away with the Phase 9 hero.
- **Files modified:** e2e/visual/hide-canvas.css
- **Verification:** Scroll-0 shots stable across 2 local runs
- **Committed in:** `c28bddb`

**4. [Rule 3 - Blocking] cwd-dependent `stylePath` and shadowed `path`**
- **Found during:** Task 1
- **Issue:** A relative `stylePath` depends on the cwd the run starts from, and the loop variable shadowed the `path` import.
- **Fix:** `stylePath` is resolved from `__dirname`; the loop variable is renamed `route`.
- **Files modified:** e2e/visual/routes.spec.ts
- **Committed in:** `c28bddb`

**5. [Rule 2 - Missing critical] Non-Linux PNGs ignored by git**
- **Found during:** Task 2
- **Issue:** A local run on Windows writes `-win32.png` files next to the baselines. They could be committed by accident.
- **Fix:** `.gitignore` ignores `e2e/**/*-win32.png` and `e2e/**/*-darwin.png` (check-snapshot-commit also rejects them).
- **Files modified:** .gitignore
- **Committed in:** `2c4e106`

**6. [Rule 2 - Missing critical] Smaller hardening additions**
- **Found during:** Task 2
- **Fix:** The selftest gained a no-spawn `{ name, fn }` case kind so `evaluate` / `evaluateSnapshotChanges` are tested in-process. `check-snapshot-commit` uses `git show --no-renames`, so a moved PNG shows as add + delete and cannot slip past the deletion rule. The workflow uploads with `if-no-files-found: error` and adds a `playwright-report` upload on failure.
- **Files modified:** scripts/guards/selftest.mjs, scripts/ci/check-snapshot-commit.mjs, .github/workflows/visual-baselines.yml
- **Committed in:** `2c4e106`

**7. [Rule 1 - Bug] Baselines first committed in the wrong folder; README clarified**
- **Found during:** Task 3 verification (previous continuation)
- **Issue:** Windows "Extract all" wraps the zip contents in a folder named after the zip, so the first baseline commit (729706c) put the PNGs in `e2e/visual/visual-baselines/`. The spec would not have found them, and the plan's literal `--allow-all` check would not have caught it.
- **Fix:** Tim ran `git mv e2e/visual/visual-baselines e2e/visual/routes.spec.ts-snapshots` and `git commit --amend --no-edit` (now 516c90c). Re-baseline step 4 in the README now says the zip's contents go directly into `routes.spec.ts-snapshots/` and that the wrapper folder must not be kept.
- **Files modified:** e2e/visual/routes.spec.ts-snapshots/** (Tim), e2e/visual/README.md
- **Verification:** per-slug `--allow` check OK (72 changed); exact name-set match against the spec matrix
- **Committed in:** `516c90c` (Tim), `bce028f` (docs)

---

**Total deviations:** 7 (4 bugs, 2 missing-critical, 1 blocking)
**Impact on plan:** All were needed for stable, correctly located baselines. No scope creep. No app code changed.

## Issues Encountered
- The plan's Task 3 verification uses `--allow-all`, which turns off the folder check. The per-slug form is the stricter check and is the one recorded below. Later plans' verifications (and the orchestrator's pre-checks) should use per-slug `--allow`.
- 516c90c and bce028f are not pushed. origin/main is at 2c4e106. Pushing is Tim's job.

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 07-04 adds the CI "Visual Regression" compare job (`--project=visual-dark --project=visual-light`, `updateSnapshots: 'none'`) against these baselines, then deletes the playground routes and removes the three temporary `globalIgnores` entries from 07-02.
- Zero-diff plans follow the README gate: Tim pushes to `ci/07-NN`, the executor runs `check-visual-run.mjs --wait 30` and `check-snapshot-commit.mjs --none`.
- The hero arrow pin in `hide-canvas.css` must be removed when Phase 9 replaces the hero.
- `DARK_PATH` in `playwright.config.ts` is unused until 07-14.

## Task 3 verification (re-run by this continuation)

| Check | Result |
|-------|--------|
| `node scripts/ci/check-snapshot-commit.mjs --sha 516c90c --some --allow-all` (plan's literal form, run while 516c90c was HEAD) | `OK (72 changed)`, exit 0 |
| Same with per-slug `--allow` for all 9 slugs | `OK (72 changed)`, exit 0 |
| Negative control: per-slug with `home` dropped | FAIL lines for `home/` files, exit 1 |
| `git ls-files 'e2e/visual/*.png'` | 72, all under `routes.spec.ts-snapshots/`, 0 outside |
| Suffixes | 36 `-visual-dark-linux.png`, 36 `-visual-light-linux.png`, 0 non-linux |
| Per ROUTES slug (9 slugs) | each 3 dark + 3 light `*-reduced` files |
| Home scroll | 9 dark + 9 light |
| Exact name set vs. spec matrix | EXACT MATCH (72) |
| PNG header check | all 72 valid PNG signatures |
| 516c90c contents | 72 added files, no modifications or deletions |
| 516c90c author / subject | tlex-web; `test(07-03): initial Linux visual baselines (Playwright 1.60.0, dark + light)` |
| Plan verification: `--list` visual projects | `Total: 72 tests in 1 file`; chromium lists 0 visual tests |
| Plan verification: `npm run lint` | exit 0 (selftest 24/24) |

## Self-Check: PASSED
- All created artifacts found on disk (routes.spec.ts, hide-canvas.css, README.md, visual-baselines.yml, both helpers, 6 fixtures, 72 PNGs)
- Commits c28bddb, 2c4e106, 516c90c, bce028f are ancestors of HEAD; `git rev-list --count 4f06461..HEAD` = 4
- Task 1-2 criteria verified by the first executor (see the previous verification list in the plan history); Task 3 criteria re-run above, all pass
- Plan verification: 72 tests listed, `npm run lint` exit 0, 72 `-linux.png` baselines committed

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-10*
