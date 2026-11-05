---
phase: 07-foundation-guardrails
plan: 16
subsystem: ui
tags: [tokens-v2, semantic-tokens, stock-palette, contact, visual-regression, re-baseline, dsgn-06, guard-04, build-step-8c]

requires:
  - phase: 07-15
    provides: "One colour value per property in every Contact class string (dark: pairs collapsed), so the mapping is one-to-one"
  - phase: 07-09
    provides: "The L2 semantic utilities (surface*, ink*, line*, accent*, danger, success) via @theme inline --color-* tokens"
  - phase: 07-11
    provides: "The global 2px focus-visible ring that replaces the removed focus:ring-* utilities"
provides:
  - "Contact route group (app/contact/page.tsx, components/FeedbackForm.tsx) on L2 semantic utilities only: stock palette count 0"
  - "contact/{375,768,1440}-reduced-visual-dark-linux.png re-baselined inside the mapping commit 1807682; no other snapshot changed"
affects: [07-17, 07-18, 07-19, 07-20, 07-24]

actuals:
  tokens: 3395    # chars/4 over `git diff e3c3218..1807682 -- app components` (13581 chars, 2 files, 46+/46-); the 3 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count e3c3218..HEAD = 1 (1807682), before the docs commits
plan_head_before: e3c3218a03c725fb9e24e6b171e591aa3989bc47
plan_head_after: 18076821e01eea2d09a1cbcf9482e5a5e2c554f4

tech-stack:
  added: []
  patterns:
    - "Staged dark: removal, stage 3 (map): one route group per commit, the stock-to-semantic mapping and its re-baseline in the same reviewed commit"
    - "Status messages as outlined boxes on a neutral surface (bg-surface-overlay border border-success/danger text-ink) instead of tinted fills"

key-files:
  created: []
  modified:
    - app/contact/page.tsx
    - components/FeedbackForm.tsx
    - e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png

key-decisions:
  - "Contact mapped to semantic tokens in 1807682 (stock count 0); the 3 contact visual-dark PNGs re-baselined in the same commit; CI run 39879694150 green (Visual, Unit, E2E)"
  - "Status boxes are outlined (bg-surface-overlay border border-success/danger text-ink) and the pending submit is the faded accent (bg-accent text-ink-inverse, opacity-50 cursor-not-allowed); Tim's D1/D2 choices, recorded in commit 1807682"
  - "DSGN-06 and GUARD-04 stay Pending: requirements.ready-ids reports both blocked, because 07-17..07-20 also declare them and have no SUMMARY yet"

patterns-established:
  - "Decorative icon tiles go neutral (bg-surface-overlay with a text-ink-muted icon), so the accent hue is not spent on decoration"

# Copied verbatim from the PLAN's `requirements`. DSGN-06 and GUARD-04 are NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports both blocked (07-17, 07-18, 07-19 and 07-20 also declare them and have no SUMMARY yet).
requirements-completed: [DSGN-06, GUARD-04]

coverage:
  - id: D1
    description: "Every stock Tailwind palette class in the Contact group is replaced by an L2 semantic utility (count 0)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "Task 1 <verify> stock-palette grep over app/contact/page.tsx components/FeedbackForm.tsx | wc -l = 0 (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No v1 alias, raw OKLCH, hex, rgba() or arbitrary colour value introduced by the mapping"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "git show 1807682 -- app components: added lines matching (alpine|granite|snow|frost|ember|pine|rust)-[0-9] | #hex | oklch( | rgba?( | (bg|text|border)-[ = 0 (close-out re-run). The 3 rgba() in app/contact/page.tsx:67/93/119 are pre-existing whileHover boxShadow inline styles, untouched"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Contact form keeps its data path, field names, labels, button text and error strings; contact-form.spec and FeedbackForm.test pass unchanged"
    requirement: SHELL-06
    verification:
      - kind: other
        ref: "git show --word-diff 1807682: only className strings change (no JSX structure, handler, attribute, label or copy); git diff 1807682~1 1807682 -- e2e/contact-form.spec.ts components/__tests__ app/api is empty (close-out re-run)"
        status: pass
      - kind: unit
        ref: "CI Unit Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39879694150/job/120173812417 (npm test; jest testMatch includes components/__tests__/FeedbackForm.test.tsx)"
        status: pass
      - kind: e2e
        ref: "CI E2E Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39879694150/job/120173812764 (playwright --project=chromium --project=firefox; testDir ./e2e, only visual/*.spec.ts ignored, so e2e/contact-form.spec.ts runs)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The mapping is its own commit, the contact/* snapshots are re-baselined in it with the reason stated, and no other snapshot changes"
    requirement: GUARD-04
    verification:
      - kind: other
        ref: "check-snapshot-commit.mjs --sha HEAD --allow contact --some -> 'snapshot-commit: OK (3 changed)', exit 0; git show --name-status 1807682: 2 source M + 3 contact PNG M, 0 A, 0 D (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha 18076821e01eea2d09a1cbcf9482e5a5e2c554f4 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39879694150/job/120173812938, exit 0 (close-out re-run)"
        status: pass
    human_judgment: true   # Tim reviewed the 3 contact PNGs before the amend (Task 2)

duration: about 18 min by commit timestamps (resume commit 2026-10-23T00:23:54Z to the amended commit 00:42:16Z), plus 1 baseline run and 2 CI runs; metadata close-out later the same day
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 16: Contact route group mapped from stock palette to semantic tokens (build step 8c)

**Commit `1807682` replaces every stock palette class in `app/contact/page.tsx` and `components/FeedbackForm.tsx` with L2 semantic utilities (stock count 0) and carries the re-baseline of the 3 `contact/*-reduced-visual-dark-linux.png` shots. Only class strings changed. CI run 39879694150 on `ci/07-16` passes Visual, Unit and E2E.**

## Performance

- **Duration:** about 18 min by commit timestamps (resume `e3c3218` 00:23:54Z, task commit authored 00:34:18Z, amend committed 00:42:16Z). The start of Task 1 work is not recorded separately. CI run 39879694150 finished at 01:21:37Z (E2E was the last job).
- **Tasks:** 2/2
- **Files modified:** 5 (2 source, 3 PNG)

## Accomplishments
- **Mapping (DSGN-06, 8c Contact), from the `1807682` diff:**
  - text: `text-white` / `text-gray-300` -> `text-ink`; `text-gray-400` -> `text-ink-muted`; `text-red-600` (required stars, field errors) -> `text-danger`.
  - surfaces: the info panel and cards `bg-gray-800/80` and `bg-gray-800/70` -> `bg-surface-raised` (alpha dropped); inputs `bg-gray-800` -> `bg-surface-overlay`; borders `border-gray-700/30` -> `border-line`.
  - inputs: `border-gray-600` -> `border-line-strong`, `border-red-500` -> `border-danger`. `focus:outline-none focus:ring-2 focus:ring-blue-500` was removed; the global focus-visible ring (07-11) applies.
  - checkbox: `text-blue-600 border-gray-300 focus:ring-blue-500` -> `text-accent border-line-strong`.
  - icon tiles: `bg-cyan/blue/purple-900/50` -> `bg-surface-overlay`, their icons `text-cyan/blue/purple-400` -> `text-ink-muted`.
- **Submit button (D2):** `bg-accent text-ink-inverse hover:bg-accent-hover`. While pending it is `opacity-50 cursor-not-allowed` on the same accent, replacing `bg-gray-400`.
- **Status boxes (D1):** success `bg-green-900 text-green-200` -> `bg-surface-overlay border border-success text-ink`; error `bg-red-900 text-red-200` -> `bg-surface-overlay border border-danger text-ink`.
- **Re-baseline:** `contact/375`, `768` and `1440-reduced-visual-dark-linux.png` were amended into `1807682` by Tim. The commit body states the reason.

## Task Commits

1. **Task 1 (tracer): Map the Contact group from stock palette to semantic tokens** - `1807682` (refactor). The pre-amend commit `d161352` had the same source change without PNGs.
2. **Task 2: Re-baseline the Contact snapshots and confirm CI green** (checkpoint:human-action, blocking-human). `d161352` push CI run 39878985745 failed only Visual Regression, as expected before the re-baseline (all other jobs green). "Update visual baselines" run 39878984916 on `d161352` (update_mode changed) succeeded. Tim amended the 3 contact PNGs into the commit (`1807682`) and force-pushed `ci/07-16` with lease. Push CI run 39879694150 was green. No separate commit.

`git rev-list --count e3c3218..HEAD` = 1, measured from the plan ledger. `50a222f` (pause) and `e3c3218` (resume) come before the ledger base and are not 07-16 work.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `app/contact/page.tsx` - heading, intro, info panel and the three info cards on semantic utilities.
- `components/FeedbackForm.tsx` - labels, inputs, error text, checkbox, submit button and status boxes on semantic utilities.
- `e2e/visual/routes.spec.ts-snapshots/contact/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined.

## Decisions Made
- **D1 outlined status boxes and D2 faded-accent disabled submit** are Tim's choices from an earlier session, recorded in the body of commit `1807682`.
- **DSGN-06 and GUARD-04 stay Pending.** `requirements.ready-ids` returns `ready: [], blocked: [DSGN-06, GUARD-04]`: 07-17, 07-18, 07-19 and 07-20 also declare both and have no SUMMARY. `requirements-completed` copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.

## Deviations from Plan

None in the delivered result: class-only edits, stock count 0, only contact/* re-baselined, CI green.
- **Plan closed out manually (Tim's recovery choice).** This SUMMARY and the state updates were written in a later session from git and CI evidence. The local Task 1 `<verify>` runs (lint, type-check, Jest, chromium contact-form.spec) have no recorded output. CI run 39879694150 covers the same checks: Lint and Type Check, Unit Tests, and E2E on chromium and firefox all passed.
- **Duplicate trailers.** The body of `1807682` has the `Co-Authored-By` / `Claude-Session` trailer pair twice, probably from the `--amend`. This is cosmetic and was left as is, because rewriting the commit would change a SHA that is already on `origin/ci/07-16`.

## Issues Encountered
- **Found for 07-24 (not acted on):** `app/contact/page.tsx:67/93/119` still has hue-coloured hover glows in inline motion props (`boxShadow: '0 20px 40px rgba(6, 182, 212, 0.3)'`, and the blue and purple equivalents). They are not classes, so the stock-palette grep and a class-based palette guard do not see them. They are out of 07-16's class-only scope and belong with the 07-24 Contact interim restyle.
- **Contrast concern from 07-15:** the FeedbackForm error text and input borders now use `text-danger` (signal-400) and `border-line-strong` (night-500) on `bg-surface-overlay` (night-850), replacing `text-red-600` (~3.2:1) and `border-gray-600` (~1.9:1). The new ratios were not measured here; the 07-20 contrast guard should confirm them.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-22 (Contact form during class mapping):** mitigated as planned. Only class strings changed; `e2e/contact-form.spec.ts`, `components/__tests__/FeedbackForm.test.tsx` and `app/api` are untouched by `1807682`, and CI Unit and E2E are green.
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-17** (8c map, group Roadmap), with the same pattern: one mapping commit, re-baseline of that group's slug only.
- **Pushing:** `1807682` is on `origin/ci/07-16`. The docs commits stay local.

## Verification (close-out, 2026-10-23)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha 18076821e01eea2d09a1cbcf9482e5a5e2c554f4 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39879694150/job/120173812938`, exit 0 |
| `check-visual-run.mjs --sha 1807682… --job "Unit Tests" --wait 1` | `PASS …/runs/39879694150/job/120173812417`, exit 0 |
| `check-visual-run.mjs --sha 1807682… --job "E2E Tests" --wait 1` | `PASS …/runs/39879694150/job/120173812764`, exit 0 |
| `check-snapshot-commit.mjs --sha HEAD --allow contact --some` | `snapshot-commit: OK (3 changed)`, exit 0 |
| `git show --name-status 1807682` | 5 M (2 source, 3 contact PNG), 0 A, 0 D |
| Task 1 stock-palette grep | 0 |
| v1 alias / hex / oklch / rgba / arbitrary colour in added lines | 0 |
| `git diff 1807682~1 1807682 -- e2e/contact-form.spec.ts components/__tests__ app/api` | empty |
| `requirements.ready-ids` DSGN-06 GUARD-04 | ready [], blocked [DSGN-06, GUARD-04] |

## Self-Check: PASSED
- `1807682` is an ancestor of HEAD; `git rev-list --count e3c3218..HEAD` = 1 from the plan ledger.
- All 5 modified files exist and are exactly the plan's `files_modified` (2 source files + `contact/**`).
- Task 1 automated stock grep and Task 2 acceptance commands re-run at close-out and pass.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
