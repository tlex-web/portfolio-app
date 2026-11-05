---
phase: 07-foundation-guardrails
plan: 14
subsystem: ui
tags: [dark-mode, tailwind-v4, custom-variant, color-scheme, playwright, pathTemplate, visual-regression, baseline-workflow, dsgn-05, build-step-8a]

requires:
  - phase: 07-13
    provides: "The 36 visual-dark baselines (post-7e icons) that visual-light now asserts against"
  - phase: 07-12
    provides: "color-scheme: dark on html (so no :root rule was needed)"
  - phase: 07-11
    provides: "The 0.01 per-pixel visual threshold that the light-equals-dark gate runs under"
  - phase: 07-03
    provides: "DARK_PATH constant, the visual-light/visual-dark projects, check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml"
provides:
  - "Class-based dark variant: @custom-variant dark (&:where(.dark, .dark *)) in app/globals.css (temporary, removed in 07-20)"
  - "<html> carries the dark class permanently (LOCKED shell contract), so every dark: utility applies to light-OS and dark-OS visitors alike"
  - "visual-light asserts against the visual-dark PNGs via expect.toHaveScreenshot.pathTemplate: DARK_PATH (with the shared SCREENSHOT options spread in)"
  - "36 *-visual-light-linux.png baselines deleted; 36 visual-dark PNGs are the only baselines"
  - "visual-baselines.yml updates --project=visual-dark only, so an update can never overwrite dark files with light output"
  - "e2e/visual/README.md documents the dark-only baseline set"
affects: [07-15, 07-20, 07-22, phase-09, phase-10, phase-11, phase-12]

actuals:
  tokens: 1396    # chars/4 over the text diff 78888d0..5737aeb excluding the PNGs (5584 chars across 5 files); the 36 deleted PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count 78888d0..HEAD = 1 (5737aeb), before the docs commits
plan_head_before: 78888d055041f8572632c10e00bf0d2e63052b37
plan_head_after: 5737aebee6aa82d6f22357de5a0a2e5976006196

tech-stack:
  added: []
  patterns:
    - "Tailwind v4 class-based dark variant via @custom-variant, keyed to html.dark, as a bridge until every dark: utility is collapsed (07-20)"
    - "One theme: a light-scheme project asserts against the dark baselines (pathTemplate), so any OS-scheme-dependent style fails CI"
    - "Shared SCREENSHOT options constant: any project-level expect override must spread it, because Playwright's project expect replaces the top-level one"

key-files:
  created: []
  modified:
    - app/globals.css
    - app/layout.tsx
    - playwright.config.ts
    - .github/workflows/visual-baselines.yml
    - e2e/visual/README.md
  deleted:
    - e2e/visual/routes.spec.ts-snapshots/**/*-visual-light-linux.png (36 files)

key-decisions:
  - "dark: is class-based via html.dark (@custom-variant dark (&:where(.dark, .dark *))); the html dark class stays permanently, only the custom variant is removed in 07-20"
  - "visual-light asserts against the visual-dark PNGs (pathTemplate: DARK_PATH); the 36 light PNGs are deleted and the baseline workflow updates visual-dark only"
  - "A project-level expect in Playwright replaces the top-level expect entirely (takeFirst(projectConfig.expect, config.expect, {})), so any future project override must spread the shared SCREENSHOT constant or it silently falls back to threshold 0.2"
  - "DSGN-05 stays Pending: requirements.ready-ids reports it blocked, because 07-15 and 07-20 also declare it and have no SUMMARY yet"

patterns-established:
  - "Light-equals-dark invariant: visual-light resolves {arg}-visual-dark{-snapshotSuffix}{ext}; a later phase that reintroduces scheme-dependent styling fails the Visual Regression job"

# Copied verbatim from the PLAN's `requirements`. DSGN-05 is NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports it blocked (07-15 and 07-20 also declare it and have no SUMMARY yet).
requirements-completed: [DSGN-05]

coverage:
  - id: D1
    description: "dark: utilities apply to every visitor: class-based @custom-variant dark plus the dark class on <html>, with no prefers-color-scheme branch left in app, components or lib"
    requirement: DSGN-05
    verification:
      - kind: other
        ref: "grep '@custom-variant dark (&:where(.dark, .dark *));' app/globals.css (line 3); app/layout.tsx:47 className starts with `dark `; grep -rn prefers-color-scheme app components lib = 0 (close-out re-run); compiled CSS 0 prefers-color-scheme rules, 87 :where(.dark,.dark *) selectors (Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "visual-light compares against the visual-dark PNGs with the full SCREENSHOT options (threshold 0.01), and only the 36 dark PNGs remain"
    requirement: DSGN-05
    verification:
      - kind: other
        ref: "playwright.config.ts:90 `expect: { toHaveScreenshot: { ...SCREENSHOT, pathTemplate: DARK_PATH } }`; plan <verify> node script -> 'dark-only baselines 36'; npx playwright test --list --project=visual-light -> Total: 36 tests in 1 file (Task 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI proves a light-OS visitor sees the dark site: Visual Regression green with visual-dark unchanged and visual-light matching the dark PNGs; the commit adds or modifies no PNG"
    requirement: DSGN-05
    verification:
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha 5737aebee6aa82d6f22357de5a0a2e5976006196 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39873723006/job/120154093327, exit 0 (close-out re-run; 72 passed)"
        status: pass
      - kind: other
        ref: "check-snapshot-commit.mjs --sha 5737aebee6aa82d6f22357de5a0a2e5976006196 --none --allow-deletions -> 'snapshot-commit: OK (36 changed)', exit 0; git show --name-status: 36 D, 5 M, 0 A (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The baseline workflow can only write dark files"
    verification:
      - kind: other
        ref: "grep -c visual-light .github/workflows/visual-baselines.yml = 0 (close-out re-run); update step runs --project=visual-dark only"
        status: pass
    human_judgment: false

duration: 14 min (2026-10-22T23:39:35Z to 23:53:50Z), including 1 CI run; no baseline run needed
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 14: Every visitor gets the dark design; visual-light now asserts against the dark baselines (build step 8a)

**Commit `5737aeb` makes `dark:` class-based (`@custom-variant dark (&:where(.dark, .dark *))`) and puts `dark` on `<html>`. Every `dark:` utility now applies to light-OS and dark-OS visitors alike, with no markup change. The 36 `*-visual-light-linux.png` baselines are deleted. visual-light resolves its snapshots through `pathTemplate: DARK_PATH`, so the light run has to match the dark PNGs exactly at threshold 0.01. The baseline workflow updates `visual-dark` only. CI run 39873723006 passes every job, with Visual reporting 72 passed: visual-dark is unchanged and visual-light is pixel-identical to it. That proves a light-OS visitor now sees the dark site.**

## Performance

- **Duration:** 14 min wall clock, including one CI run. No baseline run was needed.
- **Started:** 2026-10-22T23:39:35Z
- **Completed:** 2026-10-22T23:53:50Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 41 (5 modified source/config/doc files, 36 deleted PNGs)

## Accomplishments
- **Neutralise (DSGN-05 stage 1, zero markup change).**
  - `app/globals.css` adds `@custom-variant dark (&:where(.dark, .dark *));` directly after `@import "tailwindcss";`, with the comment "removed in plan 07-20 once no dark: utility remains".
  - `color-scheme: dark` was already on `html` from 07-12, so no `:root` rule was added.
- **Shell contract.** In `app/layout.tsx` the html className now starts with `dark ` and keeps the three font variables. The class is permanent; only the custom variant goes away in 07-20.
- **Compiled CSS (Task 1 build):**
  - 0 `prefers-color-scheme` rules;
  - 87 `:where(.dark,.dark *)` selectors;
  - 0 `prefers-color-scheme` references in `app`, `components` and `lib`.
- **Light equals dark, enforced.**
  - visual-light uses `expect: { toHaveScreenshot: { ...SCREENSHOT, pathTemplate: DARK_PATH } }`. The DARK_PATH comment now says "active since build step 8a".
  - All 36 light PNGs are removed with `git rm`.
  - `--list --project=visual-light` still reports 36 tests in 1 file.
- **The baseline workflow writes dark files only.** The `visual-baselines.yml` update step runs `--project=visual-dark` and no longer mentions visual-light anywhere (threat T-07-20 mitigated).
- **Docs.** `e2e/visual/README.md` adds the paragraph "Since 07-14 only visual-dark PNGs exist…" and drops the stale "72 PNGs" count.

## Task Commits

1. **Task 1 (tracer): Neutralise dark: for everyone and make the light run assert identity with dark.** Commit `5737aeb`: `feat(07-14): neutralise dark: for every visitor; light baselines assert dark (8a)`, body "zero markup change; deletes the light PNGs; light must now equal dark". 41 paths: 5 M, 36 D, 0 A. Tim was told the deletions are part of the plan commit. The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Gate: CI green proves light equals dark** (checkpoint, blocking-human, resolved "pushed"). `5737aeb` was plain-pushed to the new branch `ci/07-14`. CI run 39873723006 passed every job with a zero diff, so nothing was re-baselined and no new commit was made.

`git rev-list --count 78888d0..HEAD` = 1, measured from the plan ledger.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `app/globals.css`: the temporary class-based `@custom-variant dark`.
- `app/layout.tsx`: `dark` prepended to the html className.
- `playwright.config.ts`:
  - a shared `SCREENSHOT` constant (`animations: 'disabled'`, `caret: 'hide'`, `threshold: 0.01`) used at the top level;
  - visual-light spreads it and adds `pathTemplate: DARK_PATH`;
  - the DARK_PATH comment is updated.
- `.github/workflows/visual-baselines.yml`: the update step runs `--project=visual-dark` only.
- `e2e/visual/README.md`: the dark-only baseline paragraph; the stale "72 PNGs" is removed.
- `e2e/visual/routes.spec.ts-snapshots/**/*-visual-light-linux.png`: 36 files deleted.

## Decisions Made
- **`dark:` is class-based through `html.dark`.** The OS colour scheme is no longer an input: the dark design is the only design. The custom variant is a bridge until the collapse (07-15) and the removal and guard (07-20).
- **visual-light asserts against the dark PNGs, and the baseline workflow is dark-only.** This turns the light project into the invariant test for "one theme". A later change that makes any style depend on the OS scheme fails the Visual Regression job.
- **A project-level `expect` replaces the top-level `expect` in Playwright.** Any future project override must spread `SCREENSHOT` (see deviation 1).
- **DSGN-05 stays Pending.** `requirements.ready-ids` returns `ready: [], blocked: [DSGN-05]`, because 07-15 (collapse) and 07-20 (remove and guard) also declare DSGN-05 and have no SUMMARY yet. That is also the right call on the merits: the requirement says "no `dark:` variants", and 87 compiled `dark:` selectors still exist. `requirements-completed` above copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.
- **ui-ux-pro-max** was loaded before the Task 1 edits. The plan is locked, so these are notes only, and none was acted on:
  - A dark-only design is valid, but text contrast must stay at least 4.5:1.
  - Stock `dark:` pairs now reach light-OS visitors as well, for example `dark:text-gray-400` (29 uses) on `dark:bg-gray-800` (20 uses). The contrast guard is not active until 07-20.
  - Light-OS visitors gain a lot: they no longer see half-themed stock light fallbacks.
  - When the collapse removes the light base classes, the FeedbackForm fields' placeholder and autofill colours need checking (see the STATE concern).
  - The skill's `dark-mode-pairing` advice does not apply, because the locked decision is a single theme.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A project-level Playwright `expect` would have dropped visual-light to threshold 0.2**
- **Found during:** Task 1
- **Issue:** Playwright resolves a project's `expect` as `takeFirst(projectConfig.expect, config.expect, {})` (`node_modules/playwright/lib/common/index.js:607`). A project-level `expect` therefore REPLACES the top-level one; it does not merge with it. The plan's literal line `expect: { toHaveScreenshot: { pathTemplate: DARK_PATH } }` would have silently put visual-light back on Playwright's default threshold 0.2. That is the value that let 07-09's caution stop through, and it would have weakened the light-equals-dark gate this plan exists to create.
- **Fix:** a shared `const SCREENSHOT = { animations: 'disabled', caret: 'hide', threshold: 0.01 } as const`. The top level uses it as `expect: { toHaveScreenshot: SCREENSHOT }`, and visual-light spreads it before adding `pathTemplate: DARK_PATH`. visual-dark's effective options are unchanged. The acceptance string `pathTemplate: DARK_PATH` is still present.
- **Files modified:** `playwright.config.ts`
- **Verification:**
  - `--list --project=visual-light` reports 36 tests;
  - CI Visual reports 72 passed at threshold 0.01;
  - visual-dark is unchanged, and `check-snapshot-commit --none --allow-deletions` returns OK.
- **Committed in:** `5737aeb` (the Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug).
**Impact on plan:** The fix keeps the gate as strict as the plan intended. There is no scope creep.

## Issues Encountered
None. CI run 39873723006 on `5737aeb` passed every job on the first push (Visual, Unit, E2E).

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-20 (baseline workflow tampering):** mitigated as planned. The update step runs `--project=visual-dark` only, and `grep -c visual-light .github/workflows/visual-baselines.yml` = 0.
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-15 (collapse).** Every visitor already renders the dark values, and the light run guards that from now on. The collapse can swap each `dark:` pair for its dark value, and the zero-diff gate catches any slip.
- **For 07-20 / the contrast guard:** stock `dark:` pairs such as `gray-400` on `gray-800` now reach every visitor. After the collapse, check the FeedbackForm placeholder and autofill colours (logged as a STATE concern). Remove `@custom-variant dark` once no `dark:` utility remains, and keep the html `dark` class.
- **Any future Playwright project** that overrides `expect` must spread `SCREENSHOT`.
- **Still open:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. The required status checks, the hero badge contrast, the snow-50 hover, the 37 utility-styled headings and the roadmap pill concerns are unchanged.
- **Pushing:** `5737aeb` is on `origin/ci/07-14`. The docs commits stay local.

## Verification (close-out, 2026-10-22T23:53Z)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha 5737aebee6aa82d6f22357de5a0a2e5976006196 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39873723006/job/120154093327`, exit 0 (72 passed: visual-dark 36, visual-light 36 against the dark PNGs) |
| `check-visual-run.mjs --sha 5737aeb… --job "E2E Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39873723006/job/120154093319`, exit 0 |
| `check-visual-run.mjs --sha 5737aeb… --job "Unit Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39873723006/job/120154093361`, exit 0 |
| `check-snapshot-commit.mjs --sha 5737aeb… --none --allow-deletions` | `snapshot-commit: OK (36 changed)`, exit 0; the 36 are all deletions |
| PNGs in `5737aeb` | 36 deleted, 0 added or modified |
| Plan `<verify>` baseline count | `dark-only baselines 36` |
| `@custom-variant dark (&:where(.dark, .dark *));` in `app/globals.css` | line 3 |
| `app/layout.tsx` html className | ``className={`dark ${schibsted.variable} …`}`` (line 47) |
| `pathTemplate: DARK_PATH` in `playwright.config.ts` | line 90, with `...SCREENSHOT` |
| `grep -c visual-light .github/workflows/visual-baselines.yml` | 0 |
| `grep -rn prefers-color-scheme app components lib \| wc -l` | 0 |
| `public/service-worker.js` | clean |
| Task 1: `--list --project=visual-light` / lint / selftest / type-check / Jest / guard:tests / build | 36 tests in 1 file / 0 errors (54 pre-existing warnings) / 25/25 / 0 / 9 suites, 82 tests / jest 82 + e2e 72 = 154 OK / OK |
| `requirements.ready-ids` DSGN-05 | ready [], blocked [DSGN-05] (07-15 and 07-20 also declare it) |

## Self-Check: PASSED
- `5737aeb` is HEAD and an ancestor of itself. `git rev-list --count 78888d0..HEAD` = 1, measured from the plan ledger.
- No files were created. The 5 modified files contain the stated changes, and the 36 deletions are in `5737aeb`.
- Every Task 1 acceptance criterion that can be checked statically was re-run at close-out and passes. The lint, type-check, Jest and build results come from Task 1, and CI Unit Tests passes on `5737aeb`. Both Task 2 acceptance commands, plus the E2E and Unit job checks, pass against the explicit SHA `5737aeb`.
- Plan-level verification: 36 dark PNGs and 0 light PNGs; the light project lists 36 tests; CI is green, with light equal to dark and dark unchanged.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
