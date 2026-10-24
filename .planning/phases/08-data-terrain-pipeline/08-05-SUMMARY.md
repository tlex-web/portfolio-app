---
phase: 08-data-terrain-pipeline
plan: 05
subsystem: ui
tags: [tailwind-v4, design-tokens, codemod, v1-aliases, contrast-guard, palette-guard, visual-regression]

# Dependency graph
requires:
  - phase: 08-data-terrain-pipeline (08-01)
    provides: "branch state the CI zero-diff proof runs on (geo/terrain libs, ESLint scope rules)"
  - phase: 08-data-terrain-pipeline (08-03)
    provides: "CLI_X riskLevel/riskScore data; the pkill command's HIGH -> CRITICAL RISK badge change that the clix-cli visual baseline had to absorb"
  - phase: 07-foundation-guardrails
    provides: "tokens v2 L1/L2/L3 layers in app/globals.css, check-contrast.mjs, check-palette.mjs with the shell-only v1names rule, LEGACY_DEAD_FILES, selftest harness, CI Visual Regression job"
provides:
  - "L2 token --color-accent-strong: var(--glacier-500) (utilities bg-/from-/to-/border-accent-strong), the v2 name for v1 frost-600"
  - "check-contrast.mjs: accent-strong in SEMANTIC plus 4 pairs (ink-inverse on accent-strong as text; accent-strong on surface, surface-raised, surface-overlay as non-text); 32 pairs total"
  - "Eight live files free of v1 alias names and font-heading: app/(site)/page.tsx, app/(site)/projects/page.tsx, ProjectCard, Hero3DMountain, ProjectDetailClient, GeologicalButton, ContourBackground, PhotoCarousel3D"
  - "check-palette.mjs v1names rule over every scanned file, exempting only LEGACY_DEAD_FILES (while unimported) and the --color-<v1>-NNN definition lines in app/globals.css"
  - "Three palette selftest fixtures: bad-v1names-live, v1names-dead-exempt, v1names-alias-defs (selftest 59 -> 62)"
affects: [phase 9 hero rework, phase 10 photos, phase 11 projects/clix, phase 12 VERIFY-01 alias deletion]

# Actuals (#2632)
actuals:
  tokens: 10259
  tasks: 3
  commits: 2
plan_head_before: d08547512219e2802948e5242ff95a65e3a56902
plan_head_after: ac2263c15ccdb03c9fdf23df29dad5b860359da2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pixel-neutral codemod proof: build at the base and at the change, then compare each replaced utility's compiled declaration body in .next/static CSS (58 utility pairs, 0 differ)"
    - "Semantic-by-role mapping where one primitive has two v2 names: night-950 as text is ink-inverse, everywhere else surface"
    - "Adding an L2 token means adding it to check-contrast SEMANTIC and PAIRS in the same commit, and giving every contrast selftest fixture the token so each still fails only for its intended reason"

key-files:
  created:
    - scripts/guards/__selftest__/palette/bad-v1names-live/components/Card.tsx
    - scripts/guards/__selftest__/palette/v1names-dead-exempt/components/Header.tsx
    - scripts/guards/__selftest__/palette/v1names-alias-defs/app/globals.css
  modified:
    - app/globals.css
    - scripts/guards/check-contrast.mjs
    - scripts/guards/check-palette.mjs
    - scripts/guards/selftest.mjs
    - app/(site)/page.tsx
    - app/(site)/projects/page.tsx
    - components/ProjectCard.tsx
    - components/Hero3DMountain.tsx
    - components/ProjectDetailClient.tsx
    - components/GeologicalButton.tsx
    - components/ContourBackground.tsx
    - components/PhotoCarousel3D.tsx
    - scripts/guards/__selftest__/contrast/at-threshold.css
    - scripts/guards/__selftest__/contrast/below-threshold.css
    - scripts/guards/__selftest__/contrast/low-ink.css
    - scripts/guards/__selftest__/contrast/missing-danger.css
    - scripts/guards/__selftest__/contrast/unknown-token.css
    - scripts/guards/__selftest__/contrast/var-cycle.css

key-decisions:
  - "Task 3 resolved by Tim's literal reply \"a\": option A, the built --color-accent-strong: var(--glacier-500) stands for v1 frost-600 (pixel-identical, proven in CI); option B (frost-600 -> accent, token dropped, 4-route re-baseline) was not taken"
  - "Command 4 (pkill -f chrome) explanation copy \"High-risk operation - requires explicit confirmation\" beside its CRITICAL RISK badge: Tim did not answer, so data/projects.ts is unchanged and the question stays open for Tim"
  - "The widened v1names pattern matches the whole number (frost-500, not frost-5) and no longer matches inside longer words (e.g. trust-1)"
  - "ProjectCard archived badge granite-400/500 -> ink-muted (same --mist-300 primitive, zero pixel change); the semantic fit of ink-muted for a status badge is worth revisiting in Phase 12"

patterns-established:
  - "v1names: every scanned file is checked; exemptions are LEGACY_DEAD_FILES while assertNoImporters() is empty and alias definition lines in app/globals.css"

requirements-completed: [DSGN-06]

coverage:
  - id: D1
    description: "L2 token --color-accent-strong: var(--glacier-500) with its four contrast pairs measured by the contrast guard (ink-inverse/accent-strong 7.40, accent-strong on surface 7.40, surface-raised 6.93, surface-overlay 6.37)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "node scripts/guards/check-contrast.mjs -> 'contrast: OK (32 pairs)'"
        status: pass
      - kind: other
        ref: "node scripts/guards/selftest.mjs -> 'selftest: 62/62 cases passed'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Eight live files codemodded off v1 alias names and font-heading with zero visual change"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "compiled-CSS comparison: Task 1 19 utility pairs, Task 2 39 utility pairs, 0 differ (lists below)"
        status: pass
      - kind: automated_ui
        ref: "CI run https://github.com/tlex-web/portfolio-app/actions/runs/40107844864 on ci/08-05 @ ac2263c: Visual Regression success with existing baselines"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none -> 'snapshot-commit: OK (0 changed)'"
        status: pass
      - kind: other
        ref: "grep for v1 names over app components lib data e2e (minus the 3 LEGACY_DEAD_FILES) -> 0 files"
        status: pass
    human_judgment: false
  - id: D3
    description: "Palette guard v1names rule widened to every scanned file, with selftest proof that it fails on a live component and passes on the two exemptions"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "selftest cases bad-v1names-live (exit 1, 'components/Card.tsx:1 v1names frost-500'), v1names-dead-exempt (exit 0), v1names-alias-defs (exit 0); old guard passes bad-v1names-live, widened guard fails it"
        status: pass
      - kind: other
        ref: "npm run guard:palette -> 'palette: OK'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Token choice for v1 frost-600 (option A accent-strong vs option B accent) signed off by Tim"
    requirement: DSGN-06
    verification:
      - kind: manual_procedural
        ref: "Task 3 checkpoint: Tim's literal reply 'a' (option A)"
        status: pass
    human_judgment: false

# Metrics
duration: 44min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 05: v1 Alias Codemod, accent-strong Token and Widened v1names Guard Summary

**Eight live files now use v2 semantic token names instead of v1 aliases, with zero pixel change (58 replaced utilities compile to identical declarations; CI Visual Regression green on existing baselines). v1 frost-600 maps to a new L2 token `--color-accent-strong: var(--glacier-500)`, which the contrast guard measures. The palette guard's v1names rule now covers every scanned file, so v1 names survive only as the Phase 12 alias definitions and in the three dead files.**

## Task 3: CI zero-diff proof and token choice (checkpoint:human-verify, resolved)

Tim's literal reply, verbatim:

> a

The checkpoint asked for three things: (1) "green" to confirm the zero-diff CI result, (2) a token choice, option a (keep the built `--color-accent-strong: var(--glacier-500)` for the old frost-600; pixel-identical, proven in CI) or option b (map frost-600 to `accent` and drop the token; visible changes plus a 4-route re-baseline), and (3) whether to change command 4's explanation copy.

Resolution:
- **Token choice: option A.** The built state stands. No token or codemod changes were made after the checkpoint.
- **Verification:** Tim chose the built, CI-verified state. He did not separately type "green"; the human-verify is recorded as resolved by his "a" reply together with the CI evidence below.
- **Command 4 copy: open, not approved.** Tim did not answer. `data/projects.ts` is unchanged (see "Open item for Tim").

### CI evidence (ci/08-05)

Push: `git ls-remote origin refs/heads/ci/08-05` showed the branch absent; a plain `git push origin HEAD:refs/heads/ci/08-05` created it at `ac2263c15ccdb03c9fdf23df29dad5b860359da2`. No phase-branch or main push, no force push. Re-checked at close: `ls-remote` still shows `ac2263c`.

Run https://github.com/tlex-web/portfolio-app/actions/runs/40107844864 (headBranch ci/08-05, headSha ac2263c, conclusion success; the orchestrator and this continuation re-read it with gh):

| Job | Conclusion |
|-----|------------|
| Visual Regression | success |
| Lint and Type Check | success |
| Unit Tests | success |
| E2E Tests | success |
| Build Application | success |
| Security Audit | success |
| Dependency Review | skipped (push event) |

- `node scripts/ci/check-visual-run.mjs --sha HEAD --wait 30` exit 0, and with `--job` for Lint and Type Check, Unit Tests and E2E Tests, exit 0 each.
- `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none` -> `snapshot-commit: OK (0 changed)`; no e2e/visual changes in d085475..HEAD.
- No baseline workflow dispatched, no PNGs downloaded or committed.
- clix-cli passed on its existing baseline: the 08-03 HIGH -> CRITICAL RISK badge text is not in the captured frame, so step 3's clix-cli exception did not apply.

## Performance

- **Duration:** 44 min wall clock (Tasks 1-2 about 8 min of edits and three local builds; CI run 15:37:45Z to 16:05:16Z; then the checkpoint)
- **Started:** 2026-10-24T15:29:03Z
- **Completed:** 2026-10-24T16:13:00Z
- **Tasks:** 3 (Task 1 tracer, Task 2, Task 3 checkpoint)
- **Files modified:** 21 (3 created, 18 modified)

## Accomplishments

- **`accent-strong` token.** `--color-accent-strong: var(--glacier-500);` sits in the L2 `@theme inline` block after `--color-accent-hover`. check-contrast.mjs lists it in SEMANTIC and measures four new pairs: ink-inverse on accent-strong 7.40:1 (text), accent-strong on surface 7.40, surface-raised 6.93, surface-overlay 6.37 (non-text). 32 pairs total, all pass.
- **Zero-diff codemod of eight live files.** Every replacement maps to the v2 name on the same primitive. Inline-style refs moved to `var(--color-accent)` / `var(--color-ink-muted)` and emit the same primitives as `--color-frost-500` / `--color-granite-400`; the focus drop-shadow in globals.css resolves to the same `var(--glacier-400)`. No conflicting same-property utilities were introduced.
- **v1 names are gone from live code.** None remain in app/, components/, lib/, data/ or e2e/ outside Header.tsx, Footer.tsx and GlassmorphismNav.tsx (LEGACY_DEAD_FILES). The 25 alias definitions in app/globals.css are untouched for Phase 12.
- **Guard keeps them out.** v1names now runs on every scanned file. Proof: the old guard passes the bad-v1names-live fixture (exit 0); the widened guard fails it with `components/Card.tsx:1 v1names frost-500` (exit 1).

### Compiled-declaration comparison (Task 1 acceptance: each replaced utility with its identical compiled declaration)

Method: `npm run build` at the base and with the change, then each replaced utility's declaration body extracted from `.next/static/**/*.css` and compared (scratchpad `compare-css.mjs`). Every row below compared identical (`SAME`).

**Task 1, app/(site)/page.tsx (19 utility pairs, 0 differ):**

| v1 utility | v2 utility | Compiled declaration (both) |
|---|---|---|
| bg-alpine-800 | bg-surface-raised | `background-color:var(--night-900)` |
| bg-alpine-800/30 | bg-surface-raised/30 | `background-color:var(--night-900)` + `color-mix(in oklab, var(--night-900) 30%, transparent)` |
| bg-alpine-900 | bg-surface | `background-color:var(--night-950)` |
| bg-frost-500/10 | bg-accent/10 | `background-color:var(--glacier-400)` + `color-mix(... var(--glacier-400) 10% ...)` |
| bg-snow-50 | bg-ink | `background-color:var(--firn-50)` |
| border-alpine-700 | border-surface-overlay | `border-color:var(--night-850)` |
| border-frost-500/30 | border-accent/30 | `border-color:var(--glacier-400)` + `color-mix(... var(--glacier-400) 30% ...)` |
| border-frost-600/30 | border-accent-strong/30 | `border-color:var(--glacier-500)` + `color-mix(... var(--glacier-500) 30% ...)` |
| from-frost-600 | from-accent-strong | `--tw-gradient-from:var(--glacier-500)` + identical `--tw-gradient-stops` |
| hover:bg-alpine-700/40 | hover:bg-surface-overlay/40 | `:hover{background-color:var(--night-850)}` + `color-mix(... 40% ...)` |
| hover:bg-snow-100 | hover:bg-ink | `:hover{background-color:var(--firn-50)}` |
| hover:border-frost-500 | hover:border-accent | `:hover{border-color:var(--glacier-400)}` |
| text-alpine-950 | text-ink-inverse | `color:var(--night-950)` |
| text-frost-400 | text-accent | `color:var(--glacier-400)` |
| text-granite-400 | text-ink-muted | `color:var(--mist-300)` |
| text-snow-200 | text-ink-muted | `color:var(--mist-300)` |
| text-snow-50 | text-ink | `color:var(--firn-50)` |
| to-frost-500 | to-accent | `--tw-gradient-to:var(--glacier-400)` + identical `--tw-gradient-stops` |
| via-alpine-700 | via-surface-overlay | `--tw-gradient-via:var(--night-850)` + identical via-stops/stops |

**Task 2, the other seven files (39 utility pairs, 0 differ):**

| v1 utility | v2 utility | Compiled declaration (both) |
|---|---|---|
| bg-alpine-700/50 | bg-surface-overlay/50 | `background-color:var(--night-850)` + `color-mix(... 50% ...)` |
| bg-alpine-800 | bg-surface-raised | `background-color:var(--night-900)` |
| bg-alpine-800/60 | bg-surface-raised/60 | `background-color:var(--night-900)` + `color-mix(... 60% ...)` |
| bg-alpine-800/90 | bg-surface-raised/90 | `background-color:var(--night-900)` + `color-mix(... 90% ...)` |
| bg-alpine-900 | bg-surface | `background-color:var(--night-950)` |
| bg-alpine-950 | bg-surface | `background-color:var(--night-950)` |
| bg-ember-500/20 | bg-caution/20 | `background-color:var(--caution-400)` + `color-mix(... 20% ...)` |
| bg-frost-500/10 | bg-accent/10 | `background-color:var(--glacier-400)` + `color-mix(... 10% ...)` |
| bg-frost-500/15 | bg-accent/15 | `background-color:var(--glacier-400)` + `color-mix(... 15% ...)` |
| bg-frost-500/20 | bg-accent/20 | `background-color:var(--glacier-400)` + `color-mix(... 20% ...)` |
| bg-granite-400/20 | bg-ink-muted/20 | `background-color:var(--mist-300)` + `color-mix(... 20% ...)` |
| bg-pine-500/20 | bg-success/20 | `background-color:var(--meadow-400)` + `color-mix(... 20% ...)` |
| bg-snow-50 | bg-ink | `background-color:var(--firn-50)` |
| border-alpine-600 | border-line | `border-color:var(--night-700)` |
| border-ember-600/30 | border-caution/30 | `border-color:var(--caution-400)` + `color-mix(... 30% ...)` |
| border-frost-500/30 | border-accent/30 | `border-color:var(--glacier-400)` + `color-mix(... 30% ...)` |
| border-frost-600/30 | border-accent-strong/30 | `border-color:var(--glacier-500)` + `color-mix(... 30% ...)` |
| border-granite-500/30 | border-ink-muted/30 | `border-color:var(--mist-300)` + `color-mix(... 30% ...)` |
| border-pine-600/30 | border-success/30 | `border-color:var(--meadow-400)` + `color-mix(... 30% ...)` |
| focus-within:ring-frost-500/50 | focus-within:ring-accent/50 | `:focus-within{--tw-ring-color:var(--glacier-400)}` + `color-mix(... 50% ...)` |
| focus-within:ring-offset-alpine-900 | focus-within:ring-offset-surface | `:focus-within{--tw-ring-offset-color:var(--night-950)}` |
| font-heading | font-display | `font-family:var(--font-schibsted)` |
| from-frost-500 | from-accent | `--tw-gradient-from:var(--glacier-400)` + identical `--tw-gradient-stops` |
| from-frost-500/5 | from-accent/5 | `--tw-gradient-from:var(--glacier-400)` + `color-mix(... 5% ...)` + identical stops |
| group-hover:text-frost-400 | group-hover:text-accent | `:is(:where(.group):hover *){color:var(--glacier-400)}` |
| hover:bg-alpine-700/70 | hover:bg-surface-overlay/70 | `:hover{background-color:var(--night-850)}` + `color-mix(... 70% ...)` |
| hover:bg-snow-100 | hover:bg-ink | `:hover{background-color:var(--firn-50)}` |
| hover:shadow-frost-500/30 | hover:shadow-accent/30 | `:hover{--tw-shadow-color:var(--glacier-400)}` + nested `color-mix(... 30% ...)` |
| text-alpine-950 | text-ink-inverse | `color:var(--night-950)` |
| text-ember-400 | text-caution | `color:var(--caution-400)` |
| text-frost-400 | text-accent | `color:var(--glacier-400)` |
| text-granite-300 | text-ink-muted | `color:var(--mist-300)` |
| text-granite-400 | text-ink-muted | `color:var(--mist-300)` |
| text-pine-400 | text-success | `color:var(--meadow-400)` |
| text-snow-100 | text-ink | `color:var(--firn-50)` |
| text-snow-200 | text-ink-muted | `color:var(--mist-300)` |
| text-snow-50 | text-ink | `color:var(--firn-50)` |
| to-frost-500/8 | to-accent/8 | `--tw-gradient-to:var(--glacier-400)` + `color-mix(... 8% ...)` + identical stops |
| to-frost-600 | to-accent-strong | `--tw-gradient-to:var(--glacier-500)` + identical `--tw-gradient-stops` |

Each codemodded file also equals the mapping table applied to its original text (scratchpad `codemod.mjs` replay).

## Task Commits

1. **Task 1 (tracer): accent-strong token, contrast guard, home page codemod (zero diff)**: `ceeb560` (refactor)
2. **Task 2: codemod the other seven live files, widen the v1names guard, selftest cases**: `ac2263c` (refactor)
3. **Task 3: CI zero-diff proof on ci/08-05**: no commit (push of `ac2263c` to the scratch branch only; checkpoint resolved by Tim's reply "a")

**Tracer gate:** interactive run, `human_verify_mode` end-of-phase, Task 1 `<verify>` automated only. All three Task 1 verify commands passed (contrast OK 32 pairs, home page v1-free, lint/type-check/jest/build green), so the plan expanded to Task 2 with no checkpoint.

**Plan metadata:** recorded in the docs commits that follow this SUMMARY.

## Files Created/Modified

- `app/globals.css`: `--color-accent-strong: var(--glacier-500)` in L2; drop-shadow `var(--color-frost-500)` -> `var(--color-accent)`
- `scripts/guards/check-contrast.mjs`: `accent-strong` in SEMANTIC; two `pairs(...)` lines (4 pairs)
- `scripts/guards/check-palette.mjs`: v1names over every scanned file with the two exemptions; whole-number, word-bounded pattern; header doc bullet updated
- `scripts/guards/selftest.mjs`: 3 new palette cases; contrast cases updated for 32 pairs and the accent-strong ratios
- `scripts/guards/__selftest__/palette/{bad-v1names-live,v1names-dead-exempt,v1names-alias-defs}/`: new mini-repo fixtures
- `scripts/guards/__selftest__/contrast/*.css` (6 files): `--color-accent-strong: #fff;` added so each fixture still fails only for its intended reason
- `app/(site)/page.tsx`, `app/(site)/projects/page.tsx`, `components/{ProjectCard,Hero3DMountain,ProjectDetailClient,GeologicalButton,ContourBackground,PhotoCarousel3D}.tsx`: v1 -> v2 names

## Decisions Made

- **Option A (Tim, "a").** frost-600 maps to the new L2 token `accent-strong` on `--glacier-500`. This is the only mapping that keeps every pixel identical (RESEARCH OQ6 option a).
- **Role-based choice for night-950.** Text uses `ink-inverse`; backgrounds, borders, rings, ring offsets and gradient stops use `surface`.
- **ContourBackground.tsx was codemodded** although it is dead, because it is not in LEGACY_DEAD_FILES and the widened guard scans it.
- **ProjectCard archived badge** reads `bg-ink-muted/20` / `border-ink-muted/30` (was granite). Same primitive, no pixel change. A status badge on a text token is a semantic stretch, worth revisiting in Phase 12.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Contrast selftest cases broke when the token was added**
- **Found during:** Task 1
- **Issue:** Adding `accent-strong` to SEMANTIC and PAIRS made three contrast selftest cases fail: two expected "28 pairs", and the six fixture CSS files had no `--color-accent-strong`, so they failed for a missing-token reason instead of their intended one.
- **Fix:** The two cases now expect 32 pairs, the real-file case also checks the two accent-strong ratios, and the six fixtures gained `--color-accent-strong: #fff;`.
- **Files modified:** `scripts/guards/selftest.mjs`, `scripts/guards/__selftest__/contrast/{at-threshold,below-threshold,low-ink,missing-danger,unknown-token,var-cycle}.css`
- **Verification:** selftest 59/59 after Task 1, 62/62 after Task 2
- **Committed in:** `ceeb560`

**2. [Rule 1 - Bug] v1names pattern matched partial numbers and inside longer words**
- **Found during:** Task 2
- **Issue:** Widening the rule to every file exposed that the old pattern could report `frost-5` for `frost-500` and match inside longer words such as `trust-1`.
- **Fix:** The pattern now matches the whole number and only at a word boundary.
- **Files modified:** `scripts/guards/check-palette.mjs`
- **Verification:** `npm run guard:palette` -> `palette: OK`; bad-v1names-live reports `frost-500`
- **Committed in:** `ac2263c`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both keep the guards exact. No scope creep; no token or copy change beyond the plan.

## Issues Encountered

- **Redundant hover now visible in source.** `app/(site)/page.tsx:234` and `components/Hero3DMountain.tsx:97` read `bg-ink ... hover:bg-ink`. That is the pre-existing lost hover state (STATE concern from 07-10: snow-50 and snow-100 both alias firn-50). The codemod keeps it pixel-identical on purpose; Phase 9 restores a distinct hover.
- **Hero badge contrast unchanged.** `components/Hero3DMountain.tsx:70` (`text-ink` on `from-accent to-accent-strong`) keeps its known pre-existing failure (07-10 concern); Phase 9 rebuilds the hero.
- Lint 0 errors / 54 warnings, unchanged (all pre-existing React compiler warnings in v1 components). Type-check clean. Jest 268/268. Build exit 0; `public/service-worker.js` restored after each build.

## Open item for Tim (carried forward, not approved)

Command 4 on /projects/clix-cli (`pkill -f chrome`, "kill all Chrome processes") shows a CRITICAL RISK badge since 08-03, but its `explanation` still reads "High-risk operation - requires explicit confirmation". The checkpoint asked whether to reword it; Tim did not answer. `data/projects.ts` is unchanged. Rewording is a one-line data edit whenever Tim decides.

## User Setup Required

None.

## Next Phase Readiness

- Phase 12 (VERIFY-01) only has to delete the 25 alias definitions in app/globals.css and the three LEGACY_DEAD_FILES; the guard fails any live reuse before then.
- `ci/08-05` is a scratch branch at `ac2263c`; it can be deleted once the phase branch carries these commits upstream.
- Ready for 08-06.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: the 3 created fixtures and all modified files on disk
- FOUND: commits `ceeb560`, `ac2263c` (ancestors of HEAD); `origin/ci/08-05` = `ac2263c`
- Acceptance re-run at close: `--color-accent-strong: var(--glacier-500);` count 1; `'accent-strong'` in check-contrast.mjs 3 (>= 2); alias definition lines 25; live files with v1 names 0; `git diff --stat HEAD -- components/__tests__ data/projects.ts` empty
- Plan verification re-run: `contrast: OK (32 pairs)`, `selftest: 62/62 cases passed`, `palette: OK`; CI run 40107844864 success on ac2263c (Visual Regression, Lint and Type Check, Unit Tests, E2E Tests all success)
