---
phase: 07-foundation-guardrails
plan: 10
subsystem: ui
tags: [tokens-v2, oklch, tailwind-v4, theme-inline, v1-aliases, palette-shift, visual-regression, re-baseline, dsgn-06]

requires:
  - phase: 07-09
    provides: "Tokens v2 L1 primitives (--night-*, --firn-50, --mist-300, --glacier-*, --signal-400, --caution-400, --meadow-400) and L2 semantic tokens (--color-ink, --color-surface, ...) that the v1 aliases point at"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml"
  - phase: post-07-09
    provides: "Visual guard per-pixel threshold 0 (850c80e), so update_mode=changed captures every changed pixel"
provides:
  - "L3 v1 alias block in @theme inline: 27 --color-{alpine,granite,snow,frost,ember,pine,rust}-* aliases onto v2 primitives, each marked '@deprecated v1 alias, removed in Phase 12'"
  - "body base colours on semantic tokens (color: var(--color-ink); background-color: var(--color-surface))"
  - "--text-shadow-glow* kept in a non-inline @theme block (legacy until Phase 12)"
  - "All 72 visual baselines re-baselined for the night-map palette shift, in the same commit as the CSS"
affects: [07-11, 07-14, 07-16, 07-17, 07-18, 07-19, 07-20, 07-21, 07-22, phase-09, phase-12]

actuals:
  tokens: 1217    # chars/4 over the text diff 0fab9bf..e200fb2 (app/globals.css, 4866 chars); the 72 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count 0fab9bf..e200fb2 (before the docs commits)
plan_head_before: 0fab9bf48c8d4b2964d77bc7edc0534c13180112
plan_head_after: e200fb286e2daa89fbdb75b175ff327330600ec9

tech-stack:
  added: []
  patterns:
    - "Three-layer tokens complete: L1 primitives (:root), L2 semantic (@theme inline), L3 deprecated v1 aliases (@theme inline, var() onto L1) so /NN opacity modifiers compile to color-mix(in oklab, var(--glacier-400) NN%, transparent)"
    - "Palette-wide re-baseline: one feat commit carries the CSS and every changed PNG, amended by Tim after review of the update_mode=changed artifact"

key-files:
  created: []
  modified:
    - app/globals.css
    - e2e/visual/routes.spec.ts-snapshots/** (72 PNGs across all 9 route folders)

key-decisions:
  - "The v1 -> v2 alias map is copied exactly from the UI-SPEC (locked); contrast regressions it causes are recorded for later plans, not fixed here"
  - "All 72 of 72 baselines re-baselined for the palette shift (Tim reviewed and amended 835bbd7 -> e200fb2, force-pushed with lease to ci/07-10); CI run 39834067428 all green"
  - "Acceptance used per-slug --allow across all 9 routes instead of the plan's --allow-all (Tim's standing rule, strictly tighter)"
  - "DSGN-06 stays Pending: requirements.ready-ids blocks it because 07-16..07-20 still declare it"
  - "roadmap/1440-reduced-visual-light showed 9 px of ±1 AA noise on the '2.5.0' pill edge between the baseline run and the first CI run; post-amend CI passed, so it is a watch item, not a concern"

patterns-established:
  - "v1 class names keep compiling only as @deprecated aliases; new code uses semantic tokens (bg-surface, text-ink, ...)"
  - "Verify compiled CSS under .next/static/ --include=*.css (Next 16.4 Turbopack writes .next/static/chunks/*.css, not .next/static/css/)"

# Copied verbatim from the PLAN's `requirements`. DSGN-06 is NOT flipped to Complete in
# REQUIREMENTS.md: requirements.ready-ids reports it blocked, because 07-16..07-20 still
# declare it and have no SUMMARY yet.
requirements-completed: [DSGN-06]

coverage:
  - id: D1
    description: "Every v1 colour token is an @theme inline alias of a v2 primitive per the UI-SPEC map, each marked '@deprecated v1 alias, removed in Phase 12'; no v1 literal remains"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "grep -cF app/globals.css: '--color-frost-500: var(--glacier-400)', '--color-alpine-900: var(--night-950)', '--color-granite-500: var(--mist-300)', '--color-frost-glow: oklch(0.82 0.10 215 / 0.3)' -> 1 each; '@deprecated v1 alias, removed in Phase 12' -> 28 (min 24); v1 oklch literal regex -> 0 (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "body base style uses the semantic tokens var(--color-ink) and var(--color-surface)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "app/globals.css:113-116 body { color: var(--color-ink); background-color: var(--color-surface) } (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Opacity modifiers on v1 aliases still compile to color-mix(in oklab, var(--glacier-400) NN%, transparent)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "npm run build (exit 0, postbuild verify-contrast 24/24) then grep -rl 'color-mix(in oklab, var(--glacier-400)' .next/static/ --include=*.css -> match at 5/8/10/15/20/30/50/70% (Task 1)"
        status: pass
      - kind: other
        ref: "npm run lint (0 errors, 54 pre-existing warnings) && npm run type-check && npx jest --silent (9 suites, 82 tests) (Task 1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every route renders the night-map palette, re-baselined in the same commit; colour-only change, no layout movement"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha e200fb286e2daa89fbdb75b175ff327330600ec9 --some --allow clix-cli --allow clix-website --allow contact --allow home --allow not-found --allow offline --allow photos --allow projects --allow roadmap -> 'snapshot-commit: OK (72 changed)', exit 0 (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha e200fb286e2daa89fbdb75b175ff327330600ec9 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39834067428/job/120017602941, exit 0 (close-out re-run)"
        status: pass
      - kind: other
        ref: "Orchestrator review of baseline run 39830306090: 72/72 PNGs differ, none added/removed, all page sizes unchanged, Sobel edge-map unmatched edges <=1% except home motion-on hero (3-6%, hero background contrast, not movement); contact sheet 9 routes x 1440 x dark/light colour-only"
        status: pass
    human_judgment: true
    rationale: "Whether the palette shift reads as intended is a visual judgement. Tim reviewed the artifact page by page before amending the PNGs into the commit (checkpoint resolved 'pushed')"
  - id: D5
    description: "A v1 alias and the v2 semantic token that point at the same primitive render identical pixels (e.g. bg-alpine-900 and bg-surface)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "Both resolve to var(--night-950) by construction (alias block and L2 semantic block in app/globals.css); no dedicated test"
        status: pass
    human_judgment: true
    rationale: "Plan marks this truth 'verification: backstop'; it holds by construction of the var() chain but no screenshot compares the two class names side by side"

duration: 41 min (2026-10-22T18:11:15Z to 18:52Z), including CI run 39829609435, baseline run 39830306090, Tim's review and amend, and CI run 39834067428
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 10: v1 tokens retargeted as @theme inline aliases of tokens v2, semantic body colours, all 72 baselines re-baselined (7b)

**One commit (`e200fb2`) replaces every v1 colour literal in `app/globals.css` with a 27-entry `@theme inline` L3 alias block onto the tokens v2 primitives, each line marked `@deprecated v1 alias, removed in Phase 12`. It also moves `body` onto `--color-ink` / `--color-surface`. Every route now renders the night-map palette while the v1 class names keep compiling, `/NN` opacity modifiers included. The same commit carries all 72 re-baselined PNGs, which Tim reviewed as colour-only. CI run 39834067428 is green.**

## Performance

- **Duration:** 41 min wall clock. Most of it was the two CI runs, the baseline workflow and Tim's review.
- **Started:** 2026-10-22T18:11:15Z
- **Completed:** 2026-10-22T18:52Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 73 (`app/globals.css` and 72 baseline PNGs)

## Accomplishments
- **L3 v1 alias block (DSGN-06).**
  - The v1 literals are gone from the non-inline `@theme` block. A new `@theme inline` block, headed `/* L3 v1 aliases: @deprecated v1 alias, removed in Phase 12 */`, maps alpine, granite, snow, frost, ember, pine and rust onto `--night-*`, `--mist-300`, `--firn-50`, `--glacier-*`, `--caution-400`, `--meadow-400` and `--signal-400`, exactly as the UI-SPEC map specifies.
  - `--color-frost-glow` and `--color-ember-glow` are literal OKLCH values with alpha, with no relative-colour syntax.
  - `--text-shadow-glow*` stay in a non-inline `@theme` block as legacy until Phase 12.
- **Semantic body colours.** `body` uses `color: var(--color-ink); background-color: var(--color-surface)`. Headings and `small` are unchanged, because 7c owns them.
- **Opacity modifiers still compile.** Because the aliases are inline `var()` references, the compiled CSS contains `color-mix(in oklab, var(--glacier-400) N%, transparent)` at 5, 8, 10, 15, 20, 30, 50 and 70%.
- **Palette-wide re-baseline.**
  - Every one of the 72 shots changed: home has 24, and clix-cli, clix-website, contact, not-found, offline, photos, projects and roadmap have 6 each. No shot was added or removed.
  - Every page size is unchanged. The change is colour only: the green-black alpine ground becomes night navy, and frost cyan becomes glacier ice.
  - CI run 39834067428 passed every job on `e200fb2`.

## Task Commits

1. **Task 1 (tracer): v1 -> v2 alias map in @theme inline + semantic body colours** - originally `835bbd7` (feat). The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Re-baseline every route for the palette shift and confirm CI green** (checkpoint, blocking-human). Tim amended `835bbd7` with the 72 reviewed PNGs (`--no-edit`) and force-pushed with lease, giving **`e200fb2`**. Task 1 and Task 2 share that one commit.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `app/globals.css`: 40 insertions, 43 deletions. The L3 alias block in `@theme inline` (27 aliases, 28 deprecation comments including the header), `--text-shadow-glow*` in a non-inline `@theme`, and semantic `body` colours.
- `e2e/visual/routes.spec.ts-snapshots/{clix-cli,clix-website,contact,home,not-found,offline,photos,projects,roadmap}/*.png`: 72 PNGs re-baselined for the palette shift.

## Decisions Made
- **The alias map is locked.** It was copied exactly from the UI-SPEC. ui-ux-pro-max was loaded before the edit, and its contrast findings (below) are recorded for later plans instead of being fixed here.
- **Re-baseline review (orchestrator, then Tim).**
  - "Update visual baselines" ran on `ci/07-10` with suite visual and update_mode changed: run 39830306090. Because the guard has used `threshold: 0` since 850c80e, `changed` captured every changed pixel.
  - The structural edge-map comparison (Sobel, 2 px tolerance) left ≤1% of edges unmatched on every route except the home motion-on hero shots (3-6%). Inspected by eye, that comes from the hero background contrast and the hero/stat-band boundary, not from movement.
  - A contact sheet of all 9 routes at 1440, dark and light, shows colour-only change.
  - **Light scheme.** Pages whose white came from the body background now show the night surface, for example photos below the hero. That is expected 7b behaviour, and 07-14 makes light equal dark.
  - The light-mode `contact` and `404` headings were already dark on dark in the OLD baselines. That predates 7b.
- **Determinism watch item, not a concern.** 71 of 72 shots were pixel-identical between the baseline run and the first CI run's actuals. `roadmap/1440-reduced-visual-light` differed by 9 pixels, ±1 colour step, on the anti-aliased right edge of the "2.5.0" release pill. CI passed with that shot after the amend, so it is not flaking now. If it ever fails alone, suspect sub-pixel AA before a real regression.

## Deviations from Plan

None of these is an auto-fix of plan scope.

**1. [Rule 3 - Blocking] The Task 1 verify greps a CSS path that Next 16.4 does not write**
- **Found during:** Task 1
- **Issue:** The plan's `<automated>` greps `.next/static/css/`. Next 16.4 (Turbopack) writes compiled CSS to `.next/static/chunks/*.css`, so that directory does not exist and the check could never match.
- **Fix:** The same check ran against `.next/static/ --include=*.css`, and it passes. No code changed.
- **Files modified:** none
- **Verification:** The compiled CSS contains `color-mix(in oklab, var(--glacier-400) N%, transparent)` at 5, 8, 10, 15, 20, 30, 50 and 70%. `public/service-worker.js` was restored afterwards.
- **Committed in:** n/a (verification only)
- **Follow-up:** 07-16 to 07-20 may carry the same stale `.next/static/css/` path.

**2. [Acceptance - Tim's standing rule] Per-slug `--allow` instead of `--allow-all`**
- **Issue:** The plan's acceptance runs `check-snapshot-commit --some --allow-all`. Since 07-03, `--allow-all` turns off the `routes.spec.ts-snapshots/<slug>/` folder check, so Tim's rule is to list slugs explicitly.
- **Resolution:** `--some` with `--allow` for all 9 slugs. This is strictly tighter, and it prints `snapshot-commit: OK (72 changed)`.
- **Verification:** Both acceptance commands were re-run at close-out against the explicit SHA `e200fb2`.

**Context, not a deviation:** the plan's `update_mode=changed` is now exact, because the guard has used per-pixel `threshold: 0` since 850c80e (the STATE "[post-07-09]" decision). In 07-09, sub-threshold drift would have been skipped.

---

**Total deviations:** 1 Rule 3 (blocking, verification path only), 1 acceptance-command substitution (stricter).
**Impact on plan:** Every must_have truth holds. The "identical pixels" truth is a backstop that holds by construction. No scope creep, and no code change beyond the plan.

## Issues Encountered
- CI run 39829609435 on `835bbd7` failed Visual Regression only, 72 of 72 shots, as expected before the re-baseline. Every other job passed.
- **ui-ux-pro-max observations.** The alias map is locked, so these ship as they are:
  1. **Hero skip link** `components/Hero3DMountain.tsx:165` (`focus:bg-frost-600 focus:text-snow-50`) is now firn-50 on glacier-500, **2.17:1**. v1 was 2.93:1 and also failed. 07-21/07-22 replace it with the new SkipLink (ink-inverse on accent, 11.3:1).
  2. **Hero badge** `components/Hero3DMountain.tsx:73` (`text-snow-50` on `from-frost-500 to-frost-600`) is now **1.42 to 2.17:1**. v1 was 2.10 to 2.93:1. The text is 18px semibold, which is not large text. No Phase 7 plan fixes it explicitly. The likely owners are the 07-20 contrast guard or the Phase 9 hero rework.
  3. **Lost hover background.** `app/page.tsx:232` and `components/Hero3DMountain.tsx:100` use `bg-snow-50 hover:bg-snow-100`. Both now map to firn-50, so the background no longer changes on hover. The shadow and scale changes remain.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-16 (text/background contrast during the palette shift):** mitigated as planned. Every re-baselined route was reviewed by a human, and the 07-20 contrast guard is still to come. Two contrast regressions were found and recorded (Issues 1-2) because the map is locked.
- **T-07-SC (npm installs):** not applicable. No packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this is what keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-11.** The v1 class names still compile as deprecated aliases. Retiring them, the `dark:` staging and the 7c heading and `small` styles follow in later plans.
- **For later plans:**
  - The hero badge contrast (1.42 to 2.17:1) and the lost `snow-50 -> snow-100` hover are recorded in STATE as concerns for the 07-20 contrast guard and the Phase 9 hero.
  - The skip link is covered by 07-21/07-22.
  - 07-16 to 07-20 should grep compiled CSS under `.next/static/ --include=*.css`, not `.next/static/css/`.
- **Still open:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch.
- **Pushing:** `e200fb2` is on `origin/ci/07-10`. The docs commits stay local.

## Verification (close-out, 2026-10-22T18:51Z)

| Check | Result |
|-------|--------|
| `check-snapshot-commit.mjs --sha e200fb286e2daa89fbdb75b175ff327330600ec9 --some --allow` × 9 slugs | `snapshot-commit: OK (72 changed)`, exit 0 |
| `check-visual-run.mjs --sha e200fb286e2daa89fbdb75b175ff327330600ec9 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39834067428/job/120017602941`, exit 0 |
| globals.css acceptance strings (4) | 1 match each |
| `grep -c "@deprecated v1 alias, removed in Phase 12"` | 28 (min 24) |
| v1 oklch literal regex | 0 |
| body rule | `var(--color-ink)` / `var(--color-surface)` present |
| PNGs per route folder in `0fab9bf..e200fb2` | home 24; clix-cli, clix-website, contact, not-found, offline, photos, projects, roadmap 6 each; 0 added or deleted |
| `git ls-remote origin refs/heads/ci/07-10` | e200fb286e2daa89fbdb75b175ff327330600ec9 |
| Task 1: lint / type-check / jest / build | 0 errors (54 pre-existing warnings), selftest 25/25 / exit 0 / 9 suites, 82 tests / exit 0, contrast 24/24 |
| `requirements.ready-ids` DSGN-06 | ready [], blocked [DSGN-06] |

## Self-Check: PASSED
- `e200fb2` is an ancestor of HEAD. `git rev-list --count 0fab9bf..e200fb2` = 1, measured from the plan ledger.
- The modified file `app/globals.css` contains the stated changes, and the 72 PNGs are in the commit.
- Every Task 1 acceptance criterion was re-run at close-out and passes. Both Task 2 acceptance commands pass against the explicit SHA (`--allow-all` was replaced by the stricter per-slug form, deviation 2).
- Plan-level verification: the build is green with the alias `color-mix` in the compiled CSS (Task 1), and CI Visual Regression is green after the reviewed re-baseline.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
