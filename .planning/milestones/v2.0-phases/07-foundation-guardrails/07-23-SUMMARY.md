---
phase: 07-foundation-guardrails
plan: 23
subsystem: ui
tags: [shell, site-chrome, not-found, 404, error-boundary, global-error, retry, focus-management, information-disclosure, re-baseline, e2e, jest, shell-01, shell-05, build-step-9]

requires:
  - phase: 07-22
    provides: "app/(site)/ route group with SiteChrome mounted by app/(site)/layout.tsx; app/not-found.tsx and app/(site)/error.tsx in place with v1 content; e2e/shell.spec.ts conventions (toHaveCount(1) landmarks, settle helper, scrollWidth <= clientWidth)"
  - phase: 07-21
    provides: "SiteChrome with the default and static variants (router-free static SiteNav for global-error), SkipLink, SiteFooter, data/site.ts"
  - phase: 07-11
    provides: "Base h1 display style (Schibsted Grotesk, text-balance) and the three next/font loaders mirrored by global-error"
provides:
  - "components/site/NotFoundBody.tsx: server body 'Error 404' / 'Page not found' / one sentence / action row (accent 'Go to the homepage', text links Photographs and Engineering), flex flex-wrap gap-4"
  - "app/not-found.tsx renders <SiteChrome><NotFoundBody /></SiteChrome> (root not-found is wrapped only by the root layout); app/(site)/not-found.tsx renders <NotFoundBody /> for notFound() inside the group"
  - "components/site/ErrorBody.tsx ('use client'): variant section|root, onRetry; h1 'Something went wrong' (tabIndex -1, focused on mount); Try again -> onRetry; section -> homepage link, root -> Reload page (window.location.reload); never receives the error object"
  - "app/(site)/error.tsx: console.error effect kept, <ErrorBody variant=\"section\" onRetry={retry} />, reset in the signature but unused"
  - "app/global-error.tsx: own <html lang=en class=dark + fonts> and <body>, imports ./globals.css and the three font loaders, <SiteChrome variant=\"static\">, onRetry={retry}, no MotionProvider, console.error-logs the error"
  - "e2e/shell.spec.ts describe 'Shell 404' (6 tests): 404 status, no redirect, landmarks, copy, action hrefs, 375 px wrapping and 44 px actions"
  - "10 jsdom tests: components/site/__tests__/ErrorBody.test.tsx (6), components/__tests__/global-error.test.tsx (4)"
  - "not-found/{375,768,1440}-reduced-visual-dark re-baselined (Tim's amend into ecf7670)"
affects: [07-24, 07-25, 07-26, 09, 10, 12]

actuals:
  tokens: 6508    # chars/4 over `git diff 3b85e7a..d3ec816 -- . ':!*.png'` (26033 chars, 12 code files, 478+/47- incl. PNG lines); the 3 PNGs are binary and not counted
  tasks: 3        # Task 1 tracer and Task 3 executed; Task 2 checkpoint resolved by Tim's amend and reply "pushed"
  commits: 5      # measured: git rev-list --count 3b85e7a..HEAD = 5 (ecf7670, af5434c, e1cbdc7, 6a82527, d3ec816), before the docs commits
plan_head_before: 3b85e7a81fa5144b9a265bfd90d47c3d2f57553a
plan_head_after: d3ec816ac98df800d613afc5a106f9d733bf1f90

tech-stack:
  added: []
  patterns:
    - "Edge pages share one body layout (container, pt-16 pb-16, left-aligned max-w-prose, mono eyebrow, display h1 text-balance, flex flex-wrap gap-4 actions); NotFoundBody is a server component, ErrorBody the client twin"
    - "The root not-found renders SiteChrome itself because Next 16.4 wraps it only in the root layout; the (site) group not-found renders the body only"
    - "Error bodies never receive the error object: the boundary logs it and passes only onRetry, so message and digest cannot be rendered by construction"
    - "Recovery is retry() (Next 16.4); reset stays in the boundary props signature but is unused"
    - "global-error mirrors app/layout.tsx (html class, globals.css, font loaders) and uses SiteChrome variant=\"static\" with no MotionProvider"
    - "Before measuring elements inside an animated panel, wait until getAnimations() is empty (assert none left), then measure"

key-files:
  created:
    - components/site/NotFoundBody.tsx
    - components/site/ErrorBody.tsx
    - app/(site)/not-found.tsx
    - app/global-error.tsx
    - components/site/__tests__/ErrorBody.test.tsx
    - components/__tests__/global-error.test.tsx
  modified:
    - app/not-found.tsx
    - app/(site)/error.tsx
    - e2e/shell.spec.ts
    - components/SafeCanvas.tsx
    - e2e/no-webgl.spec.ts
    - eslint.config.mjs
    - e2e/visual/routes.spec.ts-snapshots/not-found/** (3 PNGs)

key-decisions:
  - "Try again calls retry(), not reset() (user-approved deviation of 2026-10-10, carried by the plan); reset stays in the (site)/error and global-error props signature but is unused"
  - "ErrorBody takes only { variant, onRetry } and never receives the error object, so the exception message and digest cannot reach the page (T-07-31); the boundaries keep console.error, and global-error also logs it"
  - "The root app/not-found.tsx renders <SiteChrome> itself: per node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md (Next 16.4.2) it handles unmatched URLs and is wrapped only by the root layout, which carries no shell. app/(site)/not-found.tsx handles notFound() inside the group. global-not-found is not used"
  - "Task 2 re-baseline: Tim amended the 3 not-found PNGs into the 404 commit (6117052 -> ecf7670) and replied 'pushed'; check-snapshot-commit --allow not-found OK (3 changed); CI run 40033926912 Visual, Unit and E2E green"
  - "The 07-22 mobile-menu touch-target test was flaky (47.99998 vs >= 48 on Firefox and chromium) because it measured rows while the panel's entry transition was still running; the fix waits for every panel animation to finish and asserts none are left, keeping the >= 48 threshold (6a82527)"

patterns-established:
  - "Every new edge page (404, section error, root error) renders exactly one Primary nav and one main, including the empty-content case"
  - "e2e 404 checks assert the HTTP status and that the final pathname equals the requested one (no redirect), per path"

# Copied verbatim from the PLAN's `requirements`. Flipped in REQUIREMENTS.md per
# requirements.ready-ids 07-23-PLAN.md SHELL-01 SHELL-05 -> ready [SHELL-01, SHELL-05], blocked [].
requirements-completed: [SHELL-01, SHELL-05]

coverage:
  - id: D1
    description: "/__no-such-page__, /gradient-mesh, /particle-buttons and /transitions return HTTP 404 with no redirect and render the 404 copy inside SiteChrome with exactly one banner, Primary nav, #main-content, main and contentinfo; /projects/no-such-slug (notFound() inside the group) does the same"
    requirement: SHELL-05
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell 404' (6 tests); CI run 40038984475 on d3ec816 E2E (chromium + firefox, 116 passed, 0 flaky)"
        status: pass
      - kind: other
        ref: "Production-server HTTP checks: 404, no redirect, nav=1 main=1, robots noindex on the four paths; /projects/no-such-slug 404; /roadmap 200"
        status: pass
    human_judgment: false
  - id: D2
    description: "No redirect and no live link to the deleted playground routes anywhere"
    requirement: SHELL-05
    verification:
      - kind: other
        ref: "bash -c 'test \"$(grep -rn \"redirect\" next.config.ts proxy.ts app | grep -ciE \"gradient-mesh|particle-buttons|transitions\")\" -eq 0' exit 0; deleted-route link greps exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "At 375 px the 404 has no horizontal scroll, the h1 is at most 2 lines and the action targets are at least 44 px"
    requirement: SHELL-05
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell 404' 375 px test (20/20 with --repeat-each=20); CI run 40038984475"
        status: pass
    human_judgment: false
  - id: D4
    description: "Section error: copy per Copywriting Contract, h1 focused on mount, Try again calls retry (not reset), homepage link; secret message and digest never rendered"
    requirement: SHELL-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/ErrorBody.test.tsx (6/6; RED af5434c 10/10 failing on behaviour assertions)"
        status: pass
    human_judgment: false
  - id: D5
    description: "global-error renders its own html.dark (lang en) and body, one Primary nav of five static links with no aria-current and no Menu, one main, the h1, no motion; Try again calls retry; Reload page calls window.location.reload; secret message and digest absent"
    requirement: SHELL-01
    verification:
      - kind: unit
        ref: "components/__tests__/global-error.test.tsx (4/4)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The designed 404 looks right in the full shell at 375, 768 and 1440"
    requirement: SHELL-05
    verification:
      - kind: automated_ui
        ref: "Update visual baselines run 40032669080 (only not-found/{375,768,1440} changed); CI run 40033926912 Visual green on Tim's amend ecf7670"
        status: pass
    human_judgment: true
    rationale: "The new 404 layout was reviewed by eye on the baseline sheets before Tim committed the PNGs"

duration: 1h 9m (ledger 3b85e7a 22:06:28Z; 404 commit authored 22:16:13Z; Tim's amend ecf7670 22:29:15Z; RED af5434c 23:10:05Z; GREEN e1cbdc7 23:13:31Z; d3ec816 23:15:55Z; includes the Task 2 wait for Tim, excludes the final CI run)
completed: 2026-10-24
status: complete
---

# Phase 7 Plan 23: 404 and error boundaries inside the shell (build step 9, part 3)

**The designed 404 ("Error 404" / "Page not found", homepage, Photographs and Engineering actions) now renders inside SiteChrome for every unmatched URL. This includes `/gradient-mesh`, `/particle-buttons` and `/transitions`, which return HTTP 404 with no redirect. The section error and root `global-error` boundaries use the same layout with the locked copy, focus the h1 on mount, never render the exception, and their "Try again" calls `retry()`. The 3 not-found PNGs were re-baselined (Tim's amend `ecf7670`). The flaky 07-22 touch-target test is fixed, and the final CI run 40038984475 on `d3ec816` is green with 116 E2E passed and 0 flaky.**

## Performance

- **Duration:** 1h 9m from the ledger (`3b85e7a`, 22:06:28Z) to `d3ec816` (23:15:55Z). This includes the Task 2 wait for Tim and excludes the final CI run.
- **Tasks:** 3/3 (plus a test-only flake fix and a comment chore)
- **Files modified:** 15 (12 code files, 3 PNGs)

## Accomplishments

- **404 inside the shell (SHELL-05 complete):**
  - `components/site/NotFoundBody.tsx` follows the UI-SPEC edge-page layout: a mono eyebrow "Error 404", the display h1 "Page not found" with `text-balance`, one sentence, and a `flex flex-wrap gap-4` action row. The row has the accent "Go to the homepage" button and two text links, Photographs (`/photos`) and Engineering (`/projects`). There is no focus move, no motion and no contour art.
  - `app/not-found.tsx` renders `<SiteChrome><NotFoundBody /></SiteChrome>`, and `app/(site)/not-found.tsx` renders `<NotFoundBody />`. There are no redirects anywhere.
  - Production server: `/__no-such-page__`, `/gradient-mesh`, `/particle-buttons` and `/transitions` all return 404 with no redirect, one nav, one main and robots `noindex`. `/projects/no-such-slug` returns 404 and `/roadmap` returns 200.
- **Shell 404 e2e (6 tests):** these cover the four paths above plus `/projects/no-such-slug`. Each checks:
  - status 404, and the final pathname equals the requested one
  - banner, Primary nav, `#main-content`, main and contentinfo, each `toHaveCount(1)`
  - h1 "Page not found", eyebrow "Error 404", action hrefs `/`, `/photos` and `/projects`
  - the expected `aria-current` item for each path
  - at 375 px: no horizontal scroll, the h1 is at most 2 lines, and the actions are at least 44 px
- **Error boundaries (SHELL-01, edge pages):**
  - `ErrorBody` has two variants. **section:** eyebrow "Error", h1 "Something went wrong", "This page hit an unexpected error. Try again, or go back to the homepage.", Try again plus a "Go to the homepage" link. **root:** "The site failed to load. Try again, or reload the page.", Try again plus "Reload page".
  - The h1 has `tabIndex={-1}` and is focused on mount. The component takes `{ variant, onRetry }` only.
  - `app/(site)/error.tsx` keeps the `console.error` effect and passes `onRetry={retry}`.
  - `app/global-error.tsx` defines its own `<html lang="en" className="dark …fonts">` and `<body>`, imports `./globals.css` and the three font loaders as in `app/layout.tsx`, and renders `<SiteChrome variant="static">`. It has no MotionProvider and logs the error with `console.error`.
- **Component tests (10; the plan required at least 7):**
  - `ErrorBody.test.tsx` (6) and `global-error.test.tsx` (4).
  - A secret message and digest are absent for both boundaries.
  - Try again calls `retry`, not `reset`.
  - Reload is asserted through jsdom's "Not implemented: navigation" console error.
  - The no-motion test first asserts that the nav rendered, so it cannot pass on an empty render.
- **Flake fix:** the 07-22 mobile-menu row-height test now waits for the panel transition to finish before it measures (see deviation 5).
- **Comment chore:** the three stale `app/error.tsx` references now name `app/(site)/error.tsx` (see deviation 6).

## Task Commits

1. **Task 1 (tracer): 404 inside the shell for unmatched and deleted routes**: `6117052` (feat), amended by Tim into `ecf7670` with the 3 not-found PNGs. Tracer gate: every `<verify>` is automated and `human_verify_mode` is end-of-phase, so the checks were re-run green and work continued.
2. **Task 2 (checkpoint:human-action, blocking-human): re-baseline not-found**: Tim amended the PNGs into `ecf7670` and replied "pushed". There is no separate commit.
3. **Task 3 (auto, tdd): section and root error boundaries (retry)**: RED `af5434c` (test), GREEN `e1cbdc7` (feat).
4. **Extra (Rule 1, test-only, 07-22 test):** `6a82527` (test).
5. **Extra (chore):** `d3ec816` (chore).

`git rev-list --count 3b85e7a..HEAD` = 5, measured from the plan ledger. `origin/ci/07-23` = `d3ec816` (fast-forward push).

## Re-baseline (Task 2)

- **Baseline run:** `ci/07-23` was first pushed at `6117052` (a plain push, new branch). The "Update visual baselines" run 40032669080 changed only `not-found/{375,768,1440}-reduced-visual-dark`. Every content route was byte-identical.
- **Push CI (run 40032669601):** Visual failed, as expected. E2E had 115 passed and 1 flaky (the 07-22 touch-target test on Firefox, 47.99998 vs `>= 48`). The other jobs passed. Determinism 6/6.
- **Review (sheets sent to Tim):**
  - the 404 in the full shell with a left-aligned "Error 404" eyebrow, the "Page not found" h1 and one sentence
  - the accent "Go to the homepage" button with the Photographs and Engineering links
  - at 375 the row wraps and the header shows Menu
- **After Tim's amend (`ecf7670`):** `check-snapshot-commit --allow not-found` returned OK (3 changed). CI run 40033926912 passed Visual, Unit and E2E. E2E had 115 passed and 1 flaky again, this time on chromium. The job took 37 min because `npx playwright install --with-deps` took 33.5 min (infrastructure); the tests themselves took 2.9 min.
- **Final CI:** run 40038984475 on `d3ec816`. All jobs passed, E2E 116 passed and 0 flaky (Chromium and Firefox).

## TDD Gate Compliance

- **Order:** the RED commit `af5434c` (`test(07-23)`) comes before the GREEN commit `e1cbdc7` (`feat(07-23)`). No refactor commit was needed.
- **RED setup:** placeholder modules made both suites load. `ErrorBody` returned `null`, and `global-error` rendered an empty `<html><body>`. The old `(site)/error` heading "Something went wrong!" does not match the locked copy.
- **RED evidence, semantic assessment:** valid. 2 suites failed and 10/10 tests failed on behaviour assertions, not on import or syntax errors. The record is in `.git/gsd-red/07-23-red.*`.
- **Machine classifier:** `gsd-tools check tdd-red-evidence` returns `INVALID_RED / invalid_record`, as it did for 07-21. Jest's default reporter is not a supported format, and installing `jest-junit` would be a package install, which this plan excludes (T-07-SC). The gate is advisory here: the plan type is `execute` and `tdd_mode` is off.

## Files Created/Modified

- `components/site/NotFoundBody.tsx`: the 404 body (new).
- `components/site/ErrorBody.tsx`: the section and root error bodies (new).
- `app/not-found.tsx`: rewritten, renders the shell plus the 404 body.
- `app/(site)/not-found.tsx`: the group not-found (new).
- `app/(site)/error.tsx`: rewritten to use ErrorBody with retry.
- `app/global-error.tsx`: the root error boundary with its own html and body (new).
- `components/site/__tests__/ErrorBody.test.tsx` (6 tests) and `components/__tests__/global-error.test.tsx` (4 tests): new.
- `e2e/shell.spec.ts`: adds the `Shell 404` describe (+93 lines, `ecf7670`) and the panel-transition wait (`6a82527`).
- `components/SafeCanvas.tsx`, `e2e/no-webgl.spec.ts`, `eslint.config.mjs`: comment paths only (`d3ec816`).
- `e2e/visual/routes.spec.ts-snapshots/not-found/*`: 3 PNGs.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing check] Added `/projects/no-such-slug` to the Shell 404 loop**
- **Found during:** Task 1.
- **Issue:** the plan's four paths all hit the root not-found, so nothing exercised `app/(site)/not-found.tsx` (the `notFound()` path inside the group).
- **Fix:** added `/projects/no-such-slug`. That path has `aria-current` on Engineering (prefix match), so each path declares its expected current item. **Commit:** `ecf7670`.

**2. [Rule 1 - Bug] A comment tripped the deleted-route greps**
- **Found during:** Task 1. A comment named the deleted routes, so the acceptance greps did not return 0.
- **Fix:** reworded the comment. **Commit:** `ecf7670`.

**3. [Rule 1 - Bug] No-horizontal-scroll is asserted against `clientWidth`**
- **Issue:** the plan says `scrollWidth <= innerWidth`. Because of the 07-12 stable gutter, `innerWidth` is the wrong reference (same reason as 07-22 deviation 3).
- **Fix:** the test asserts `scrollWidth <= clientWidth` and also `clientWidth <= innerWidth`. **Commit:** `ecf7670`.

**4. [Process] No prettier pass on `e2e/shell.spec.ts`**
- The file at HEAD was not prettier-clean. The Shell 404 block is pure additions, so formatting the whole file would have mixed unrelated churn into the commit.

**5. [Rule 1 - Bug, test-only, 07-22 test] Flaky mobile-menu touch-target test**
- **Found during:** Task 2 CI. Run 40032669601 failed on Firefox and run 40033926912 on chromium, both with 47.99998 vs `>= 48`.
- **Issue:** the test measured row heights while the panel's entry transition (`@starting-style`) was still running.
- **Fix:** wait for all panel animations to finish, assert none are left, then measure. The `>= 48` threshold is unchanged, and SiteNav and the CSS are untouched.
- **Verification:** `--repeat-each=20` on chromium passed 20/20 in dev and 20/20 under PW_PROD. As a control, the old spec on the same PW_PROD build failed 3/20 with 47.99998474121094. The 404 action-height test passed 20/20 (it has no entry animation). Final CI run 40038984475 had 0 flaky.
- **Commit:** `6a82527` (scoped `test(07-22)` because it fixes a 07-22 test).

**6. [Cleanup] Stale comments point at `app/(site)/error.tsx`**
- `components/SafeCanvas.tsx`, `e2e/no-webgl.spec.ts` and `eslint.config.mjs` named `app/error.tsx`, as noted in 07-22's Next Phase Readiness. These are comment-only edits. **Commit:** `d3ec816`.

**7. [Threat model] global-error also logs the error**
- `global-error.tsx` has a `console.error` effect, matching `(site)/error`. Under T-07-31, errors go only to the console. **Commit:** `e1cbdc7`.

---

**Total deviations:** 4 auto-fixed (1 missing check, 3 bugs, of which one is the test-only flake fix), 1 cleanup, 1 threat-model addition, 1 process note.
**Impact on plan:** no scope change. No source behaviour changed outside the plan's files. The flake fix touches only the test.

## Issues Encountered

- **Local cold dev server:** the shell and no-webgl e2e passed 27/27 on chromium under PW_PROD. On the first dev-server run after a production build, 1 or 2 no-webgl tests timed out while `/projects/clix-cli` and `/photos` compiled. This never happened under PW_PROD or in CI, which uses a production build. It was not reproduced on the base commit, so it is recorded as local dev-server cold-start behaviour, not proven unrelated.
- **CI infrastructure:** in run 40033926912, `npx playwright install --with-deps` took 33.5 min. The tests themselves took 2.9 min.

### Full checks

| Check | Result |
|-------|--------|
| Task 1: `npm run type-check && npm run lint && npx jest --silent && npm run build` | type-check 0; lint 0 (guards OK, selftest 45/45); Jest 97/97; build OK |
| Task 1 acceptance | `<SiteChrome>` and `<NotFoundBody` in `app/not-found.tsx`; copy and `flex flex-wrap gap-4` in NotFoundBody; redirect grep 0; deleted-route link greps 0; white/black in new files 0. PASS |
| Task 1 `npx playwright test e2e/shell.spec.ts --project=chromium` | green, including the 6 Shell 404 tests |
| Task 2 | check-snapshot-commit `--allow not-found` OK (3 changed); CI run 40033926912 Visual, Unit, E2E PASS |
| Task 3 `npx jest ErrorBody.test.tsx global-error.test.tsx` | 10/10 (at least 7 required) |
| Task 3 full | type-check 0, lint 0, build OK, Jest 107/107; `guard:tests` "jest 107 + e2e 95 = 202 (baseline 91) OK" |
| Task 3 acceptance | `onRetry={retry}` in `(site)/error.tsx`; `variant="static"`, `import './globals.css'`, `Schibsted_Grotesk` in `global-error.tsx`; `error\.message\|digest` in ErrorBody = 0; `MotionProvider` in global-error = 0. PASS |
| Shell and no-webgl e2e, chromium, PW_PROD | 27/27 |
| Final CI run 40038984475 on `d3ec816` | every job passed; E2E 116 passed, 0 flaky |

## Findings

- **`notFound()` inside `/projects/[slug]` has no server-rendered 404 (pre-existing).** The response status is 404, but the server HTML is an empty `<html id="__next_error__">`. The shell and the 404 UI render client-side from the RSC payload. The same happens with the group not-found removed, so this plan did not cause it. Without JavaScript, that path shows nothing. It is recorded as a STATE concern for Phase 12 (EDGE-01).
- **RSC payload:** content routes now carry the group not-found tree in their RSC payload. Nothing rendered or styled changed, and the content snapshots are byte-identical.
- **Short pages (orchestrator observation, note only):** on short pages such as the 404, the footer ends mid-viewport with plain page background below it. There is no sticky-footer or `min-h-screen` layout, and the UI-SPEC does not require one.

## Known Stubs

None. All copy is the locked Copywriting Contract text, and the action hrefs are real routes.

## Threat Flags

None new.
- **T-07-31 (information disclosure):** mitigated. ErrorBody never receives the error. The tests assert that a secret message and digest are absent for both boundaries, and the errors go only to `console.error`.
- **T-07-SC:** no package installs. `jest-junit` was deliberately not installed.

## User Setup Required

None from this plan.

## Next Phase Readiness

- **07-24** (interim Contact contrast fix, SHELL-06) is next. The 07-16 STATE concern about Contact's inline `rgba` hover glows applies to it.
- **07-25:** SHELL-03 still needs the metadata, author and email copy and the forbidden-strings guard.
- **Requirements:** SHELL-01 and SHELL-05 are Complete (ready-ids: both ready).

## Self-Check: PASSED

- `components/site/NotFoundBody.tsx`, `components/site/ErrorBody.tsx`, `app/(site)/not-found.tsx`, `app/global-error.tsx` and both test files exist on disk.
- `ecf7670`, `af5434c`, `e1cbdc7`, `6a82527` and `d3ec816` are ancestors of HEAD. `git rev-list --count 3b85e7a..HEAD` = 5.
- No source, test or PNG file changed during close-out.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-24*
