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
  - "Fixme commit 3757994 (firefox.decision A): the 7 cases are fixme on Firefox only. Run 43487342878 on it: E2E green on all three engines (chromium 512, firefox 434 + 7 fixme, webkit 439, no Page crashed), Visual Regression green, Security Audit green"
  - "GUARD-03 conflict: the test-count ratchet rejects every .fixme( under e2e/, so Unit Tests and CI OK fail on 3757994 (second decision needed)"
  - "Tag commit cffcf99 (firefox.exclusion A-tag): the 7 cases carry @firefox-43967 and only the firefox project excludes it (FIREFOX_INVERT). Run 43494117521 on it: every job green, CI OK success (check run 132142890020); E2E chromium 512, firefox 434, webkit 439, 0 skipped, 0 flaky, no Page crashed"
  - "The one approved baseline dispatch (run 43500162579, update_mode=changed, head cffcf99): 48 PNGs, all 48 blob-identical to HEAD, so no PNG changed"
affects: [13-20 Task 3 (Tim's resume reply, expected "none"), 13-22 (DEPS-06 also declared there; hand-over: remove the @firefox-43967 tags and the Firefox invert entry)]

ci:
  approval: approve-leave-140   # Tim's literal AskUserQuestion selection: "approve-leave-140 (Recommended)"
  branch: ci/13-pw165
  pushed_sha: cffcf99a9ba6928ddfba4ab3c0bd29e9120344be
  run: 43494117521
  conclusion: success
  ci_ok_check_run: 132142890020
  node_version: v24.22.2
  e2e_duration: 37m24s
  runs:
    - { run: 43478232610, sha: 515c7df, conclusion: failure, cause: "7 Firefox Page crashed; Security Audit runner lost" }
    - { run: 43487342878, sha: 3757994, conclusion: failure, cause: "Unit Tests: GUARD-03 rejects the 5 .fixme( calls; E2E, Visual Regression, Security Audit green", e2e_duration: 30m48s }
    - { run: 43494117521, sha: cffcf99, conclusion: success, cause: "every job green; E2E 1385 passed, 0 skipped, 0 flaky", e2e_duration: 37m24s }
  reruns_used: 0
firefox:
  decision: A   # Tim's literal AskUserQuestion selection: "A: Firefox-only fixme (Recommended)"
  fixme_commit: 375799436c703f5f62fcad1aa0ef7e6ec68e7773
  guard_conflict: "scripts/guards/test-count.mjs (GUARD-03) fails on any .fixme( under e2e/; option A's test.fixme wording (written by the orchestrator) conflicted with it. The CI Unit Tests job runs it (npm run guard:tests, ci.yml:134); local npm run lint does not"
  exclusion: A-tag   # Tim's literal AskUserQuestion selection: "A-tag (Recommended)"
  tag_commit: cffcf99a9ba6928ddfba4ab3c0bd29e9120344be
  tag: "@firefox-43967"
fallout_commits:
  - 375799436c703f5f62fcad1aa0ef7e6ec68e7773   # test(13): fixme 7 Firefox cases crashed by Playwright #43967 (DEPS-06 fallout)
  - cffcf99a9ba6928ddfba4ab3c0bd29e9120344be   # test(13): exclude 7 Firefox cases via @firefox-43967 instead of fixme (GUARD-03, #43967)
baseline_run: 43500162579   # visual-baselines.yml, suite visual, update_mode changed, headBranch ci/13-pw165, headSha cffcf99
changed_pngs: []   # 48 downloaded, 48 SAME by git blob hash against HEAD; nothing placed

actuals:
  tokens: 15000    # chars/4 over the realized diff: this SUMMARY (~46,000 chars), the spec edits of 3757994 and cffcf99 (~2,400 + ~7,100 chars of diff) and deferred-items (~3,500 chars)
  tasks: 2         # Task 1 resolved before dispatch; Task 2 complete (CI OK green, baseline compared); Task 3 awaits Tim
  commits: 4       # MEASURED: git rev-list --count 515c7df..HEAD before this docs commit = 4 (72525ff docs, 3757994 test, 157139c docs, cffcf99 test)
plan_head_before: 515c7df4baf1aaf2e6a99c5b2bbd09171994c716
plan_head_after: cffcf99a9ba6928ddfba4ab3c0bd29e9120344be

tech-stack:
  added: []
  patterns:
    - "Read a running job's log through `gh api --allow-escape-sequences repos/<o>/<r>/actions/jobs/<id>/logs` (gh run view --log refuses until the whole run completes)"
    - "Per-engine counts come from the HTML report's embedded report zip (per-file JSON, `projectName` and `outcome`)"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md
  modified:
    - e2e/audit.spec.ts
    - e2e/case-study.spec.ts
    - e2e/roadmap.spec.ts
    - playwright.config.ts
    - .planning/phases/13-repo-safety-test-debt/deferred-items.md

key-decisions:
  - "13-20: Tim's literal answer to Task 1 was the AskUserQuestion selection \"approve-leave-140 (Recommended)\"; recorded as ci.approval approve-leave-140"
  - "13-20: the 7 Firefox failures on 1.65 are an upstream browser crash (Playwright #43967 / Mozilla 2090055), not 1.65 accessible-name, inert-wait or test.slow fallout; no app code is involved, so the executor stopped for Tim's decision instead of fixing"
  - "13-20: Tim's literal answer on the Firefox stop was the AskUserQuestion selection \"A: Firefox-only fixme (Recommended)\"; recorded as firefox.decision A and implemented as 3757994 (test.fixme on Firefox for exactly the 7 cases)"
  - "13-20: GUARD-03 (test-count ratchet, v2.0 phase 7) fails on any .fixme( under e2e/, so option A as worded cannot reach CI OK; the executor did not bypass or edit the guard and stopped for a second decision"
  - "13-20: Tim's literal answer on the GUARD-03 stop was the AskUserQuestion selection \"A-tag (Recommended)\"; recorded as firefox.exclusion A-tag and implemented as cffcf99 (title tag @firefox-43967 on the 7 cases, excluded only by the firefox project's FIREFOX_INVERT; guard untouched)"

requirements-completed: []   # DEPS-06 not marked yet: Task 3 (Tim's reply) is still open

duration: 50min + 45min (continuation) + 55min (second continuation)
completed: null
---

# Phase 13 Plan 20: Playwright 1.65 in CI and Re-baseline Summary (partial)

**Second continuation (2026-11-13):** Tim chose "A-tag (Recommended)". Commit cffcf99 replaces the five `test.fixme` calls with a ` @firefox-43967` title tag on the same 7 cases, and only the firefox project excludes the tag (`FIREFOX_INVERT` in `playwright.config.ts`). GUARD-03 is untouched. Run 43494117521 on cffcf99 went green on every job, and CI OK passed (check run 132142890020). E2E ran chromium 512, firefox 434 and webkit 439, with 0 skipped, 0 flaky and no `Page crashed`, in 37m24s. The one approved baseline dispatch (run 43500162579, `update_mode=changed`) returned 48 PNGs, and all 48 are blob-identical to HEAD, so no PNG changed. Task 3 waits for Tim's reply, which is expected to be "none".

**Continuation (2026-11-13):** Tim chose "A: Firefox-only fixme (Recommended)". Commit 3757994 marks exactly the 7 cases `test.fixme` on Firefox. On run 43487342878, E2E went green on all three engines (chromium 512, firefox 434 plus 7 fixme, webkit 439, no `Page crashed`, 30m48s), and Visual Regression and Security Audit were green too. CI OK still failed, because the Unit Tests job's GUARD-03 test-count ratchet rejects every `.fixme(` under `e2e/`. The executor stopped for a second decision, and the baseline dispatch is held for the head that decision produces.


**The first three-engine CI run on Playwright 1.65 (run 43478232610 on `ci/13-pw165`, node v24.22.2) passed chromium (512/512), webkit (439/439), and Visual Regression with zero pixel diff (96/96). Firefox failed 7 of 441 tests, each one deterministically with `Page crashed` on all 3 attempts. The cause is an upstream Firefox 159 segfault (Playwright issue #43967, Mozilla bug 2090055), reproduced locally. Fixing it means choosing between a coverage trade-off and a delay, so the executor stopped for Tim's decision. Nothing was dispatched, re-baselined or changed in code.**

## Performance

- **Started:** 2026-11-13T17:59:32Z
- **Stopped at the decision:** about 2026-11-13T18:50Z (about 50 min, most of it the CI run)
- **Tasks:** Task 1 resolved before dispatch. Task 2 stopped at a decision after the first CI run. Task 3 not reached.
- **Continuation:** 2026-11-13T18:52Z to about 19:40Z. The fixme commit was pushed at 18:55:53Z, run 43487342878 finished at 19:27:01Z, and Task 2 stopped at a second decision (GUARD-03, see "Continuation" below).
- **Second continuation:** about 2026-11-13T19:28Z to 20:25Z. The tag commit cffcf99 was pushed at 19:38:31Z, run 43494117521 finished at 20:16:18Z, and baseline run 43500162579 finished at 20:19:44Z. Task 2 is complete, and Task 3 is returned as a checkpoint.

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

### State at the first stop (superseded by the continuation below)

- No fallout commit.
- No "Update visual baselines" dispatch, because E2E was not green. No PNG was downloaded, placed or changed.
- Task 3 was not reached. Dependabot #140 was not touched.

## Continuation: firefox.decision A and the GUARD-03 conflict

### The decision

**firefox.decision: A.** This is Tim's literal answer, an AskUserQuestion selection: "A: Firefox-only fixme (Recommended)". The option text he chose: one test-only commit marks the 7 tests `test.fixme` on Firefox, citing #43967. Chromium and WebKit still run all 7, and the baseline step continues afterwards. Firefox loses 7 checks until a later Playwright bump, and 13-22 hands over a follow-up to remove the fixmes.

### Fixme commit 3757994 (test-only, pixel-neutral)

`test(13): fixme 7 Firefox cases crashed by Playwright #43967 (DEPS-06 fallout)`, 3 files, +30/-1, no app code, no visual spec, no snapshot. Each call is `test.fixme(<condition>, '<reason>')` at the top of the test body, with `browserName` taken from the fixture args. The reason string is `Playwright #43967 / Firefox 159: page crash on a named role lookup followed by a main-world aria-labelledby read; remove after the next Playwright Firefox roll`, and each file links the issue URL once in a comment.

| # | Case | Condition | What still runs on Firefox |
|---|------|-----------|----------------------------|
| 1, 2 | `audit.spec.ts` "photos Map view", "photos Carousel view" (one loop body over `PHOTO_VIEWS`) | `browserName === 'firefox' && FIREFOX_43967_VIEWS.has(name)` (the set `['Map', 'Carousel']`, keyed on the tuple's own `name`) | "photos Grid view" |
| 3 | `audit.spec.ts` "contact error summary" | `browserName === 'firefox'` | |
| 4 | `audit.spec.ts` "contact register signed" | `browserName === 'firefox'` | |
| 5, 6 | `case-study.spec.ts` section order, loop over `[box, coinFlip]` | `browserName === 'firefox'` (both loop cases failed, so the loop body is the exact scope) | the Metrics test and the rest of the file |
| 7 | `roadmap.spec.ts` "@1280: each track is one row ..." | `browserName === 'firefox'` | "@375: each track is two columns ..." |

**Local checks.** `npm run lint` exited 0 and `npm run type-check` exited 0. Prettier is clean on the three files. Prettier also wanted to rewrap a pre-existing line in `case-study.spec.ts:103`, and that hunk was reverted to keep the commit scoped. On Windows with the dev server, the 7 cases plus the Grid view and @375 neighbours gave Firefox `7 skipped, 2 passed` and Chromium `9 passed`, with `--retries=0`. The dev server stopped afterwards, port 3000 is free, and no `next build` ran.

**Push.** `git ls-remote` showed origin `ci/13-pw165` at 515c7df. `git merge-base --is-ancestor 515c7df HEAD` held, so `git push origin HEAD:refs/heads/ci/13-pw165` was a fast-forward (`515c7df..3757994`). It carried the docs commit 72525ff and the fixme commit. No force push was used.

### CI run 43487342878 (push, head 3757994), conclusion failure

| Job | Result | Started | Completed | Duration |
|-----|--------|---------|-----------|----------|
| Classify changes | success | 18:55:57Z | 18:56:04Z | 7s |
| Lint and Type Check | success | 18:56:06Z | 18:58:01Z | 1m55s |
| Unit Tests | **failure**: Jest 105 suites / 1757 tests passed, then `guard:tests` failed | 18:56:06Z | 18:57:25Z | 1m19s |
| Build Application | skipped (needs Unit Tests) | | | |
| Visual Regression | **success**, zero diff again | 18:56:07Z | 18:59:05Z | 2m58s |
| **E2E Tests** | **success**: 1385 passed, 7 skipped, 0 flaky, 0 failed (29.6m) | 18:56:06Z | 19:26:54Z | **30m48s** |
| Security Audit | success (the runner-loss failure on 515c7df did not recur; no re-run used) | 18:56:06Z | 18:57:08Z | 1m02s |
| Dependency Review | skipped (push event) | | | |
| CI OK | failure (Unit Tests) | 19:26:57Z | 19:27:01Z | 4s |

**E2E per engine** (from the run's HTML report, `projectName` x `outcome`):

| Engine | Passed | Skipped (fixme) | Failed | Flaky |
|--------|--------|-----------------|--------|-------|
| chromium | 512 | 0 | 0 | 0 |
| firefox | 434 | **7** | 0 | 0 |
| webkit | 439 | 0 | 0 | 0 |
| Total | 1385 | 7 | 0 | 0 (1392 tests, 1 worker) |

All 7 skipped entries are Firefox, each carries the `fixme` annotation, and they are exactly the 7 cases above. The job log contains no `Page crashed`, and no other Firefox test crashed. The container was `mcr.microsoft.com/playwright:v1.65.0-noble`, and the log shows `node: v24.22.2`. E2E took 30m48s, against 38m43s on 515c7df and the 13-15 baselines of 28m31s and 37m40s. That is under the 45-minute line, so it is not flagged.

### The GUARD-03 conflict (why the executor stopped again)

The Unit Tests job ran `npm run guard:tests` (`scripts/guards/test-count.mjs`, the v2.0 phase 7 test-count ratchet). It printed `test-count: jest 1757 + e2e 561 = 2318 (baseline 2243)`, so the count passed. Then it failed on every `.fixme(` call:

```
test-count: FAIL e2e/audit.spec.ts:304: focused/skipped call ".fixme(" (tests are rewritten, never skipped)
test-count: FAIL e2e/audit.spec.ts:335: focused/skipped call ".fixme(" (tests are rewritten, never skipped)
test-count: FAIL e2e/audit.spec.ts:362: focused/skipped call ".fixme(" (tests are rewritten, never skipped)
test-count: FAIL e2e/case-study.spec.ts:263: focused/skipped call ".fixme(" (tests are rewritten, never skipped)
test-count: FAIL e2e/roadmap.spec.ts:401: focused/skipped call ".fixme(" (tests are rewritten, never skipped)
```

The guard rejects any line under `e2e/` that matches `/\.(only|skip|fixme)\(/`, with no exception mechanism. So option A, as worded with `test.fixme`, can never reach CI OK. The local `npm run lint` does not run `guard:tests`, which is why the conflict did not show before the push. Getting past it means either editing the guard or reaching the same exclusion another way. Both change what Tim approved, so the executor did not bypass the guard (for example with `test['fixme']`) and did not edit it. The options are in the checkpoint returned with this SUMMARY. The repo already has an engine-exclusion route that passes the guard: a title tag plus that project's `grepInvert` in `playwright.config.ts` (`@chromium-only`, and the 12-23 D-18 WebKit platform tags).

### Baseline dispatch held

The "Update visual baselines" dispatch was not run. CI OK is red on 3757994, and the GUARD-03 decision will add a commit, so the one approved dispatch is kept for that head. Visual Regression passed with zero diff on both 515c7df and 3757994, so `update_mode=changed` is still expected to return no changed PNG. `git status --porcelain -- e2e/visual/routes.spec.ts-snapshots` is empty.

### Not done yet at the first continuation (superseded by the second continuation below)

- The GUARD-03 decision and its commit, then a green CI OK on ci/13-pw165.
- The baseline dispatch, download and compare. Task 3 (Tim's PNG commit, or "none"; check-visual-run; check-snapshot-commit per changed slug).
- Dependabot #140 was not touched. Under approve-leave-140 it stays open for Dependabot.

## Second continuation: firefox.exclusion A-tag

### The decision

**firefox.exclusion: A-tag.** This is Tim's literal answer, an AskUserQuestion selection: "A-tag (Recommended)". The option text he chose: replace the fixmes with a title tag such as `@firefox-43967` on exactly those cases, excluded only for Firefox in `playwright.config.ts` (the way `@chromium-only` and the WebKit list already work). The guard stays untouched, and Chromium and WebKit still run all 7. The downside is that Firefox's report won't list them as skipped, so the tag and the deferred item are the only reminder.

**Why it was needed.** Option A's `test.fixme` wording was written by the orchestrator, and it conflicted with GUARD-03. The CI Unit Tests job runs that guard (`npm run guard:tests`, ci.yml:134), but the local `npm run lint` does not.

### Tag commit cffcf99 (test/config only, pixel-neutral)

`test(13): exclude 7 Firefox cases via @firefox-43967 instead of fixme (GUARD-03, #43967)`. It touches 4 files (+38/-29), with no app code, no visual spec and no snapshot.

- **The fixmes are gone.** All 5 `test.fixme(` calls from 3757994 are removed. So are the `browserName` fixture args that only they used, in `case-study.spec.ts` and `roadmap.spec.ts`. The audit tests still use `browserName` for `audit()`. The `FIREFOX_43967` reason string is removed. The issue-URL comments now describe the tag exclusion.
- **Where the tag goes.** ` @firefox-43967` sits at the end of each title, the way `@chromium-only` and `@no-win-webkit` are placed, with a comment above that names the reason:
  - `audit.spec.ts`: inside the `PHOTO_VIEWS` loop, `const firefox43967 = FIREFOX_43967_VIEWS.has(name) ? ' @firefox-43967' : ''` is appended to the title. Map and Carousel get the tag and Grid does not. "contact error summary" and "contact register signed" have it in their literal titles.
  - `case-study.spec.ts`: the `[box, coinFlip]` loop title, so both cases carry it.
  - `roadmap.spec.ts`: the @1280 title. @375 is untagged.
- **The config.** `playwright.config.ts` adds `FIREFOX_ONLY_TAGS = ['@firefox-43967']` and `FIREFOX_INVERT = new RegExp([OTHER_ENGINE_INVERT.source, ...FIREFOX_ONLY_TAGS].join('|'))`. A comment cites the issue URL and says to remove it "after the Playwright release with the Firefox roll that fixes it". The firefox project now uses `FIREFOX_INVERT`. Only the firefox project had used `OTHER_ENGINE_INVERT`, so its definition is left unchanged as the base. `CHROMIUM_INVERT` and `WEBKIT_INVERT` are untouched.
- **No tag allowlist to update.** `git grep` over `scripts`, `lib`, `.github`, `package.json` and `e2e/helpers` found no guard or test that validates title tags. The only match, `lib/__tests__/frame-budget-policy.test.ts`, strips `@chromium-only` from `e2e/home-canvas.spec.ts` titles and is not affected. No guard or selftest was changed.

**`--list` counts** (Windows; "CI" means `CI=1`, that is prod mode):

| Project | Before (157139c) local / CI | After (cffcf99) local / CI |
|---------|-----------------------------|----------------------------|
| chromium | 507 / 512 | 507 / 512 |
| firefox | 441 / 441 | **434 / 434** |
| webkit (win32 tags) | 426 / 426 | 426 / 426 |

**Local CI gates, all exit 0.** `npm run lint` includes `guard:parity` (`parity: OK`) and the guard selftests. `npm run type-check` passed. `npm test -- --json --outputFile=<scratchpad>/jest-results.json` passed 105 suites and 1757 tests. GUARD-03 was then run as the Unit Tests job runs it, `node scripts/guards/test-count.mjs --jest <that file>`, once with `CI=true` and once without: `test-count: jest 1757 + e2e 561 = 2318 (baseline 2243)` and `... e2e 556 = 2313`, both `test-count: OK`. The unique e2e key count is unchanged, because the renamed titles stay unique across projects. `git grep` finds no `.fixme(`, `.skip(` or `.only(` under `e2e/`. Prettier is clean on the touched lines. The CRLF working-copy endings and the pre-existing `case-study.spec.ts:103` wrap are unchanged.

**Local runs** (dev server, Windows):
- `--project=chromium --grep @firefox-43967`: 7 passed.
- The webkit half of the same run could not launch, because the 1.65 WebKit binary (webkit-2388) is not installed locally. That is the local environment, not the change, and CI covers it below.
- `--project=firefox e2e/roadmap.spec.ts e2e/case-study.spec.ts`: 58 passed and 1 failed. The failure was the untouched "Pause is sticky: nothing advances until it is pressed again (D-02)", and it then passed 3/3 with `--repeat-each=3`. That is a local parallel-load flake and is not related to the change.
- Afterwards the dev server was stopped and port 3000 was free. No `next build` ran, so `public/service-worker.js` was not rewritten.

**Push.** origin `ci/13-pw165` was at 3757994, and `git merge-base --is-ancestor origin/ci/13-pw165 HEAD` held. `git push origin HEAD:refs/heads/ci/13-pw165` was a fast-forward (`3757994..cffcf99`) that carried docs commit 157139c and cffcf99. No force push was used.

### CI run 43494117521 (push, head cffcf99), conclusion success

| Job | Result | Started | Completed | Duration |
|-----|--------|---------|-----------|----------|
| Classify changes | success | 19:38:34Z | 19:38:44Z | 10s |
| Lint and Type Check | success | 19:38:47Z | 19:40:21Z | 1m34s |
| Unit Tests | success: Jest 105 suites / 1757 tests; `test-count: jest 1757 + e2e 561 = 2318 (baseline 2243)`, `test-count: OK` | 19:38:48Z | 19:40:08Z | 1m20s |
| Build Application | success | 19:40:24Z | 19:41:42Z | 1m18s |
| Visual Regression | success, 96 passed (2.3m), node v24.22.2 | 19:38:47Z | 19:42:09Z | 3m22s |
| **E2E Tests** | **success**: 1385 passed (36.2m), 0 skipped, 0 flaky, 0 failed | 19:38:47Z | 20:16:11Z | **37m24s** |
| Security Audit | success | 19:38:47Z | 19:39:46Z | 59s |
| Dependency Review | skipped (push event) | | | |
| **CI OK** | **success** (check run 132142890020) | 20:16:13Z | 20:16:18Z | 5s |

**E2E per engine** (from the run's HTML report, `projectName` x `outcome`). The report stats are `total 1385, expected 1385, unexpected 0, flaky 0, skipped 0`.

| Engine | Passed | Skipped | Failed | Flaky | `@firefox-43967` cases |
|--------|--------|---------|--------|-------|------------------------|
| chromium | 512 | 0 | 0 | 0 | 7 passed |
| firefox | 434 | 0 | 0 | 0 | absent (excluded by FIREFOX_INVERT) |
| webkit | 439 | 0 | 0 | 0 | 7 passed |

The job log contains no `Page crashed`. The container was `mcr.microsoft.com/playwright:v1.65.0-noble`, and the log shows `node: v24.22.2` and the command `npx playwright test --project=chromium --project=firefox --project=webkit --fail-on-flaky-tests`. E2E took 37m24s, against 30m48s on 3757994, 38m43s on 515c7df, and the 13-15 baselines of 28m31s and 37m40s. That is under the 45-minute line, so it is not flagged. No re-run was used.

### Baseline dispatch (the single approved one)

- `gh workflow run visual-baselines.yml --ref ci/13-pw165 -f suite=visual -f update_mode=changed` ran at 20:17:18Z, after `git ls-remote` confirmed the branch at cffcf99. That started run **43500162579**, and `gh run list` showed it as `workflow_dispatch`, headBranch `ci/13-pw165` and headSha `cffcf99a9ba6928ddfba4ab3c0bd29e9120344be` before the wait.
- `gh run watch --exit-status` returned 0. The job "Update baselines" passed from 20:17:25Z to 20:19:44Z, using the container `v1.65.0-noble`, `node: v24.22.2`, `npx playwright test --project=visual-dark --update-snapshots="$UPDATE_MODE"` with `UPDATE_MODE: changed`, and `48 passed (1.1m)`.
- The `visual-baselines` artifact (22.3 MB) was downloaded into a new empty scratchpad dir, `dl-baselines-43500162579`. It held 48 files.
- `compare-pngs.sh` hashed each one with `git hash-object` against `HEAD:e2e/visual/routes.spec.ts-snapshots/<route>/<file>`. The result was **48 SAME** and 0 CHANGED, NEW or ODD, out of 48 committed snapshots.
- **No PNG changed**, so nothing was copied into `e2e/visual/routes.spec.ts-snapshots/`, and `git status --porcelain` on it is empty.
- `GITHUB_TOKEN=$(gh auth token) node scripts/ci/check-visual-run.mjs --sha cffcf99a9ba6928ddfba4ab3c0bd29e9120344be --wait 30` printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/43494117521/job/132122726931` and exited 0. With `--job "CI OK"` it printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/43494117521/job/132142890020`.

### Not done yet

- Task 3: Tim's resume reply. With no PNG changed, the expected reply is "none", and no PNG commit or extra CI run is needed.
- STATE.md and ROADMAP.md are not updated yet, and DEPS-06 is not marked complete.
- Dependabot #140 was not touched. Under approve-leave-140 it stays open for Dependabot.

## Hand-over to 13-22

- **Remove the `@firefox-43967` tags and the Firefox invert entry.** Do this after the Playwright release with the Firefox roll that fixes https://github.com/microsoft/playwright/issues/43967 (Mozilla bug 2090055), then re-run the three-engine E2E. The mechanism is in cffcf99, which replaced the 3757994 fixmes: drop the tag from the 7 titles (in `audit.spec.ts`, `FIREFOX_43967_VIEWS` and its title suffix), delete `FIREFOX_ONLY_TAGS` and `FIREFOX_INVERT`, and point the firefox project back at `OTHER_ENGINE_INVERT`. `npx playwright test --list --project=firefox` must go from 434 back to 441. The cases are `e2e/audit.spec.ts` photos Map and Carousel views, contact error summary and contact register signed; `e2e/case-study.spec.ts` section order on /projects/box and /projects/coin-flip; and `e2e/roadmap.spec.ts` @1280 layout. After removing them, re-run the three-engine E2E and confirm Firefox runs all 441 with no `Page crashed`. Also logged in `deferred-items.md`.

## Deviations from Plan

**1. [Rule 1 - Bug, upstream] Firefox-only exclusion of 7 tests (Tim's decision A)**
- **Found during:** Task 2, run 43478232610
- **Issue:** Firefox 159 crashes the page in 7 tests under Playwright 1.65 (#43967)
- **Fix:** commit 3757994, `test.fixme` on Firefox for exactly those cases, per Tim's selection "A: Firefox-only fixme (Recommended)"
- **Files modified:** e2e/audit.spec.ts, e2e/case-study.spec.ts, e2e/roadmap.spec.ts
- **Commit:** 3757994

**2. [Rule 4 - stop] GUARD-03 rejects `.fixme(`**
- **Found during:** Task 2, run 43487342878 (Unit Tests, `guard:tests`)
- **Issue:** the test-count ratchet forbids skipped tests under `e2e/`, so the decision-A mechanism fails CI OK
- **Action:** stopped for Tim's decision. No guard edit, no bypass, and the baseline dispatch is held.

**3. [Rule 1 - Bug, upstream] The Firefox exclusion moved from fixme to a title tag (Tim's decision A-tag)**
- **Found during:** Task 2, after run 43487342878
- **Issue:** the decision-A `test.fixme` calls fail GUARD-03 in the CI Unit Tests job
- **Fix:** commit cffcf99, ` @firefox-43967` on exactly the 7 titles, plus a Firefox-only `FIREFOX_INVERT` (`OTHER_ENGINE_INVERT` plus the tag) in `playwright.config.ts`, per Tim's selection "A-tag (Recommended)". GUARD-03 and its selftests are unchanged, and no tag allowlist exists to update.
- **Files modified:** e2e/audit.spec.ts, e2e/case-study.spec.ts, e2e/roadmap.spec.ts, playwright.config.ts
- **Commit:** cffcf99

## Issues Encountered

- `gh run view --job <id> --log` refuses while any job in the run is still in progress. The job-log API (`gh api --allow-escape-sequences .../actions/jobs/<id>/logs`) works per completed job.
- The Security Audit runner lost contact with GitHub on 515c7df (infrastructure). It did not recur on 3757994, so the one allowed infrastructure re-run was not used.
- The local `npm run lint` chain does not include `guard:tests`, so a `.fixme(` or `.skip(` passes locally and fails only in the CI unit job. Running `npx jest --json --outputFile=<tmp>` and then `node scripts/guards/test-count.mjs --jest <tmp>` before a push would catch it. The second continuation ran exactly that before pushing cffcf99. `deferred-items.md` now suggests (not implemented) that `npm run lint` or a pre-push check also run `guard:tests`.
- The HTML reporter is the only E2E reporter, so the job log has no per-test lines. Per-engine counts and the tagged-case placement come from the report artifact's embedded zip. That needed the scratchpad tools `report-stats.mjs` and `per-project.mjs`, plus a new `tagged.mjs` that counts project x outcome for titles containing a tag.
- The local Windows WebKit 1.65 binary (webkit-2388) is not installed, so local WebKit runs fail at launch. It was not installed during this run, and CI's Linux WebKit ran all 7 tagged cases green.

## Known Stubs

None. The 7 Firefox exclusions are tracked as a hand-over to 13-22, not as stubs.

## Self-Check: PASSED

- `.planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md` exists.
- `git ls-remote origin refs/heads/ci/13-pw165` returns `cffcf99a9ba6928ddfba4ab3c0bd29e9120344be`, which is HEAD before this docs commit. `git merge-base --is-ancestor 3757994 HEAD` and `git merge-base --is-ancestor cffcf99 HEAD` both hold.
- Run 43494117521: headSha cffcf99, event push, conclusion success, with the jobs as tabled. CI OK check run 132142890020 shows PASS through `check-visual-run.mjs --job "CI OK"`.
- Run 43500162579: workflow_dispatch, headBranch ci/13-pw165, headSha cffcf99, conclusion success. All 48 PNGs are SAME by blob hash.
- `git grep -n "fixme(\|\.skip(\|\.only(" -- e2e` is empty, and `git grep -c "@firefox-43967"` on the titles covers exactly the 7 cases (6 literal titles plus the computed Map and Carousel suffix).
- `git status --porcelain -- e2e/visual/routes.spec.ts-snapshots` is empty, and no PNG was placed or committed.
- Port 3000 is free, and no watcher or background shell is left running.

---
*Phase: 13-repo-safety-test-debt*
*Status: partial (Task 2 complete: CI OK green on cffcf99, baseline compared with no PNG changed; Task 3 awaits Tim's reply)*
