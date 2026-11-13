---
phase: 13-repo-safety-test-debt
plan: 20
subsystem: e2e-toolchain
status: partial
tags: [deps-06, playwright, firefox-crash, ci, visual-regression]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-18 bump commit 5ab6d15 (Playwright 1.65.0 with container tag v1.65.0-noble, five files)"
provides:
  - "ci/13-pw165 pushed at 515c7df (the 1.65 bump plus docs only since main d48af99)"
  - "First three-engine CI run on 1.65 (run 43478232610): chromium and webkit green, Visual Regression green with zero pixel diff, 7 deterministic Firefox 'Page crashed' failures"
  - "Root cause of the 7 failures: Firefox 159 content-process segfault when ariaLabelledByElements is read in two JS worlds (Playwright issue #43967, Mozilla bug 2090055), reproduced locally"
affects: [13-20 Task 2 continuation (decision needed), 13-22 (DEPS-06 also declared there)]

ci:
  approval: approve-leave-140   # Tim's literal AskUserQuestion selection: "approve-leave-140 (Recommended)"
  branch: ci/13-pw165
  pushed_sha: 515c7df4baf1aaf2e6a99c5b2bbd09171994c716
  run: 43478232610
  conclusion: failure
  node_version: v24.22.2
  e2e_duration: 38m43s
fallout_commits: []
baseline_run: null   # not dispatched: E2E is not green (brief: dispatch only when E2E is green)
changed_pngs: null   # not produced yet

actuals:
  tokens: 6500     # chars/4 over the realized diff: this SUMMARY only (~26,000 chars); no code changed
  tasks: 1         # Task 1 resolved before dispatch; Task 2 stopped at a decision; Task 3 not reached
  commits: 0       # MEASURED: git rev-list --count 515c7df..HEAD before this docs commit = 0 (docs-only plan so far)
plan_head_before: 515c7df4baf1aaf2e6a99c5b2bbd09171994c716
plan_head_after: 515c7df4baf1aaf2e6a99c5b2bbd09171994c716

tech-stack:
  added: []
  patterns:
    - "Read a running job's log through `gh api --allow-escape-sequences repos/<o>/<r>/actions/jobs/<id>/logs` (gh run view --log refuses until the whole run completes)"
    - "Per-engine counts come from the HTML report's embedded report zip (per-file JSON, `projectName` and `outcome`)"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md
  modified: []

key-decisions:
  - "13-20: Tim's literal answer to Task 1 was the AskUserQuestion selection \"approve-leave-140 (Recommended)\"; recorded as ci.approval approve-leave-140"
  - "13-20: the 7 Firefox failures on 1.65 are an upstream browser crash (Playwright #43967 / Mozilla 2090055), not 1.65 accessible-name, inert-wait or test.slow fallout; no app code is involved, so the executor stopped for Tim's decision instead of fixing"

requirements-completed: []   # DEPS-06 not yet verifiable: E2E red on Firefox, no re-baseline yet

duration: 50min
completed: null
---

# Phase 13 Plan 20: Playwright 1.65 in CI and Re-baseline Summary (partial)

**The first three-engine CI run on Playwright 1.65 (run 43478232610 on `ci/13-pw165`, node v24.22.2) passed chromium (512/512), webkit (439/439), and Visual Regression with zero pixel diff (96/96). Firefox failed 7 of 441 tests, each one deterministically with `Page crashed` on all 3 attempts. The cause is an upstream Firefox 159 segfault (Playwright issue #43967, Mozilla bug 2090055), reproduced locally. Fixing it means choosing between a coverage trade-off and a delay, so the executor stopped for Tim's decision. Nothing was dispatched, re-baselined or changed in code.**

## Performance

- **Started:** 2026-11-13T17:59:32Z
- **Stopped at the decision:** about 2026-11-13T18:50Z (about 50 min, most of it the CI run)
- **Tasks:** Task 1 resolved before dispatch. Task 2 stopped at a decision after the first CI run. Task 3 not reached.

## Task 1: Approval (checkpoint:decision, gate blocking-human)

**ci.approval: approve-leave-140.** This is Tim's literal answer, an AskUserQuestion selection that the orchestrator asked ahead of time on 2026-11-13: "approve-leave-140 (Recommended)". The option covers a plain push of the local phase branch (with the 1.65 commit) to the new branch ci/13-pw165, fast-forward pushes of any test fixes, one "Update visual baselines" dispatch with download and compare, and one CI run on his PNG commit. Tim still commits and pushes the PNGs himself, and #140 stays open for Dependabot.

## Task 2: Three-engine CI on 1.65

### Push

- `git ls-remote origin 'refs/heads/ci/13-*'` returned nothing, so the branch was new.
- `git diff --stat origin/main...HEAD -- . ':!.planning'` listed only the five files of the bump `5ab6d15`. Everything else since main is `.planning` docs.
- `git push origin HEAD:refs/heads/ci/13-pw165` at 17:59:44Z created the branch at `515c7df4baf1aaf2e6a99c5b2bbd09171994c716`. No force push was used.

### CI run 43478232610 (push, head 515c7df), conclusion failure

| Job | Result | Started | Completed | Duration |
|-----|--------|---------|-----------|----------|
| Classify changes | success (docs_only false, new branch) | 17:59:49Z | 17:59:54Z | 5s |
| Lint and Type Check | success | 17:59:57Z | 18:01:31Z | 1m34s |
| Unit Tests | success | 17:59:57Z | 18:01:20Z | 1m23s |
| Build Application | success | 18:01:34Z | 18:02:37Z | 1m03s |
| Visual Regression | **success**, 96 passed (2.3m) | 17:59:57Z | 18:04:04Z | 4m07s |
| **E2E Tests** | **failure**, 7 failed, 1385 passed, 0 flaky (36.8m) | 17:59:57Z | 18:38:40Z | **38m43s** |
| Security Audit | failure: "The hosted runner lost communication with the server." | 17:59:57Z | 18:44:57Z | 45m00s |
| Dependency Review | skipped (push event) | | | |
| CI OK | failure (E2E Tests and Security Audit) | 18:45:00Z | 18:45:06Z | 6s |

**Node version.** Both container jobs ran setup-node from `.node-version`. They logged `Found in cache @ /__t/node/24.22.2/x64` and then `node: v24.22.2` (E2E log line 199, Visual Regression log line 199). That is Node 24, not the image's Node 26, so assumption A4 holds.

**Container.** Both jobs pulled `mcr.microsoft.com/playwright:v1.65.0-noble`.

**E2E per engine** (from the run's HTML report, `projectName` x `outcome`):

| Engine | Passed | Failed | Flaky |
|--------|--------|--------|-------|
| chromium | 512 | 0 | 0 |
| firefox | 434 | **7** | 0 |
| webkit | 439 | 0 | 0 |
| Total | 1385 | 7 | 0 (1392 tests, 1 worker) |

**E2E duration.** The job took 38m43s, and the test step 36.8m. The 13-15 baselines were 28m31s on 90758db and 37m40s on 962e732. That is under the 45-minute line, so it is not flagged.

**Visual Regression on 1.65: zero pixel diff.** Every visual-dark and visual-light screenshot matched the committed 1.64.1 Linux baselines at `threshold: 0.01`. Chromium 158's rendering did not move a pixel on any route. When the baseline dispatch runs, `update_mode=changed` will most likely return no changed PNG.

**Security Audit.** All its steps passed (`npm audit` 18:00:01-18:00:49Z and the vulnerability check). The job then hung in "Post Setup Node.js" until GitHub failed it with the annotation "The hosted runner lost communication with the server." Its log blob is gone (`BlobNotFound`). This is runner infrastructure and has nothing to do with 1.65. It needs a re-run, which Task 3's single allowed re-run, or the next push, will cover.

### The 7 Firefox failures

Every failure is `Page crashed`, on the first attempt and on both retries:

| # | Test | Crashing call |
|---|------|---------------|
| 1 | `e2e/audit.spec.ts:289` state "photos Map view" /photos @375/768/1440 | `frame.evaluate` in `AxeBuilder.analyze` (helpers/audit.ts:189) |
| 2 | `e2e/audit.spec.ts:289` state "photos Carousel view" /photos?view=carousel @375/768/1440 | same |
| 3 | `e2e/audit.spec.ts:323` state "contact error summary" /contact @1440 | same |
| 4 | `e2e/audit.spec.ts:345` state "contact register signed" /contact @1440 (API mocked) | same |
| 5 | `e2e/case-study.spec.ts:257` sections keep the fixed order on /projects/box (ENG-02) | `locator.allTextContents` |
| 6 | `e2e/case-study.spec.ts:257` sections keep the fixed order on /projects/coin-flip (ENG-02) | same |
| 7 | `e2e/roadmap.spec.ts:395` @1280: each track is one row and the groups sit side by side | `locator.boundingBox` (after a named `getByRole('group')` with `evaluateAll`) |

**Root cause (diagnosed before any change).**
- **Traces.** The traces in the run's `playwright-report` artifact show each test's page crashing 0.6-1.4 s after `goto`. Every crash comes from a main-world read (an axe-core `runPartial` scan, `evalOnSelectorAll`/`evaluateAll`) that follows a **named** `getByRole` lookup resolved in Playwright's utility world: `toBeVisible` on `getByRole('article', { name })`, `getByRole('region', { name })`, `getByRole('button', { name: /Send Message/ })` or `getByRole('group', { name })`.
- **The upstream bug.** This matches Playwright issue #43967, "[Regression]: Firefox page crashes on getByRole with a name when aria-labelledby is also read in the main world" (last good 1.64.1, first bad 1.65.0). Playwright 1.65 began reading `element.ariaLabelledByElements` in the utility world. Firefox 159 segfaults its content process when that property is read in two JS worlds, in either order. Playwright's triage bot reproduced it in Firefox 159.0 on Linux and attributes it to Mozilla bug 2090055. A commenter isolated axe-core 4.14.0's `aria-prohibited-attr` and `hidden-content` rules as its main-world reads. A maintainer closed the issue on 2026-11-09 with "Should be fixed in the next FF roll".
- **No fixed release yet.** npm dist-tags: `latest` 1.65.0, `next` 1.66.0-alpha-2026-11-13. Playwright `main` lists Firefox revision 1578, still 159.0.
- **This repo fits the mechanism.** `aria-labelledby` appears in the elements these pages render (`app/(site)/projects/[slug]/page.tsx`, `components/projects/sections/*`, `components/roadmap/RouteLogFilters.tsx`, `components/contact/*`, `app/(site)/photos/page.tsx`). The app never reads `ariaLabelledByElements`: `git grep` finds no use outside `node_modules`. Only `node_modules/axe-core/axe.min.js` and `node_modules/playwright-core/lib/coreBundle.js` read it.
- **Local reproduction.** On Windows, with the dev server and Firefox 159.0 (playwright firefox v1572), `npx playwright test e2e/case-study.spec.ts e2e/roadmap.spec.ts -g "fixed order on /projects/box|each track is one row" --project=firefox --retries=0` gave 2 failed, with `locator.allTextContents: Page crashed` and `locator.boundingBox: Page crashed`. So the crash is not specific to the container. The dev server stopped afterwards and port 3000 is free. `public/service-worker.js` was not rewritten, because no `next build` ran.

**Why the executor stopped instead of fixing.** This is not fallout from the 1.65 changes the brief expects (accessible-name rules, inert waits, the `test.slow` signature). None of those caused a failure: chromium and webkit are fully green, and the bare `test.slow()` calls type-check and run. It is a browser crash with no app defect behind it. Every fix trades Firefox coverage, test style or schedule, so it needs Tim's decision (Task 2 brief: "needs a design decision, stop and return a checkpoint"). The options are in the checkpoint returned with this SUMMARY.

### Not done yet (blocked on the decision)

- No fallout commit.
- No "Update visual baselines" dispatch, because E2E is not green. No PNG was downloaded, placed or changed: `git status --porcelain -- e2e/visual/routes.spec.ts-snapshots` is empty.
- Task 3 (Tim's PNG commit, CI OK, check-visual-run, check-snapshot-commit) was not reached.
- Dependabot #140 was not touched. Under approve-leave-140 it stays open for Dependabot.

## Deviations from Plan

None so far. The stop is the plan's own route for a failure that needs a design decision.

## Issues Encountered

- `gh run view --job <id> --log` refuses while any job in the run is still in progress. The job-log API (`gh api --allow-escape-sequences .../actions/jobs/<id>/logs`) works per completed job.
- The Security Audit runner lost contact with GitHub (infrastructure). See the table above.

## Known Stubs

None. No code changed.

## Self-Check: PASSED

- `.planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md` exists.
- `git ls-remote origin refs/heads/ci/13-pw165` returns `515c7df4baf1aaf2e6a99c5b2bbd09171994c716`, which is HEAD before this docs commit.
- Run 43478232610: headSha 515c7df, event push, conclusion failure, with the jobs as tabled.
- `git status --short` before this commit shows only the four untracked paths (`.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/`). No PNG was modified.
- Port 3000 is free, and no watcher or background shell is left running.

---
*Phase: 13-repo-safety-test-debt*
*Status: partial (stopped at a Task 2 decision)*
