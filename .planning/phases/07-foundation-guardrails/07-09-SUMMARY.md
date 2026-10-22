---
phase: 07-foundation-guardrails
plan: 09
subsystem: ui
tags: [tokens-v2, oklch, tailwind-v4, motion-tokens, motion-config, reduced-motion, visual-regression, dsgn-06, dsgn-08]

requires:
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml, 72 Linux baselines"
  - phase: 07-05
    provides: "motion 14.1 (motion/react) that MotionConfig comes from"
  - phase: 07-08
    provides: "Playwright 1.64.0 / Chromium 156 and v1.64.0-noble containers the visual gate ran on"
provides:
  - "Tokens v2 L1 primitives in :root (--night-*, --firn-50, --mist-300, --glacier-*, --signal-400, --caution-400, --meadow-400, --gallery-black)"
  - "16 L2 semantic tokens in @theme inline (--color-surface*, --color-ink*, --color-line*, --color-accent*, --color-focus, --color-danger, --color-caution, --color-success, --color-contour, --color-gallery)"
  - "Motion tokens: --duration-fast/panel/hover/fracture/enter/settle in :root and --ease-geological/crystallize/tectonic/erosion/descent in @theme static, mirrored by DURATION/EASING in lib/animations.ts"
  - "cssDuration() / cssEase() helpers, and a Jest parity test that fails on any missing or differing CSS/JS motion value"
  - "MotionProvider (MotionConfig reducedMotion=\"user\", DURATION.enter + EASING.geological) wrapping the app in app/layout.tsx"
  - "v1 amber tokens removed; the one usage is now to-caution (no alias)"
  - "Reduced-motion rule for ::view-transition-* and html scroll-behavior"
affects: [07-10, 07-16, 07-17, 07-18, 07-19, 07-20, 07-22, phase-09, phase-10, phase-11]

actuals:
  tokens: 2333    # chars/4 over the text diff ea9ccf8..cd5ac18 (9330 chars, 6 files)
  tasks: 2
  commits: 1      # measured: git rev-list --count ea9ccf8..cd5ac18 (before the docs commits)
plan_head_before: ea9ccf8bff7163648c9812a765a45d5608990e0c
plan_head_after: cd5ac18a5f91f267067ad7dcf6989161c087e3ad

tech-stack:
  added: []
  patterns:
    - "Three-layer tokens: L1 raw OKLCH primitives in :root, L2 semantic names in @theme inline as var() references, motion easings in @theme static"
    - "CSS/JS motion parity: lib/animations.ts is the JS source; motion-tokens.test.ts matches each DURATION/EASING key by name against globals.css"
    - "App-wide motion defaults via one MotionConfig (reducedMotion=\"user\") instead of per-component reduced-motion branches"

key-files:
  created:
    - lib/__tests__/motion-tokens.test.ts
    - components/providers/MotionProvider.tsx
  modified:
    - app/globals.css
    - lib/animations.ts
    - app/layout.tsx
    - components/FeatureShowcase.tsx

key-decisions:
  - "Task 2 closed as zero-diff (Tim's option A): CI Visual Regression passed on cd5ac18 and 'Update visual baselines' (update_mode=changed) rewrote 0 of 72 PNGs, so no baselines were committed, no amend, no force-push"
  - "The to-caution colour shift is below Playwright's default per-pixel threshold 0.2 (YIQ delta ~355 vs the ~1409 cut-off), which is why the zero-tolerance gate did not flag it"
  - "The commit body's 'Re-baseline: ... expected changes: clix-cli/* and clix-website/*' line was left unamended to avoid a force-push; this SUMMARY is the record of truth"
  - "DSGN-06 and DSGN-08 stay Pending in REQUIREMENTS.md: requirements.ready-ids blocks both because 07-10, 07-16..07-20 and 07-22 still declare them"

patterns-established:
  - "New motion values are added to both lib/animations.ts and globals.css in the same commit; the parity test enforces it"
  - "Components consume semantic tokens (bg-surface, text-ink, to-caution), never L1 primitives"

# Copied verbatim from the PLAN's `requirements`. Neither ID is flipped to Complete in
# REQUIREMENTS.md: requirements.ready-ids reports both blocked, because 07-10, 07-16..07-20
# (DSGN-06) and 07-22 (DSGN-08) still declare them and have no SUMMARY yet.
requirements-completed: [DSGN-06, DSGN-08]

coverage:
  - id: D1
    description: "Tokens v2 L1 primitives in :root and the 16 L2 semantic tokens in @theme inline, with the UI-SPEC values"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "grep -cF in app/globals.css for '--night-950: oklch(0.17 0.024 255)', '--color-ink-muted: var(--mist-300)', '--color-contour: oklch(0.94 0.008 85 / 0.14)', '@theme static', '--ease-descent: cubic-bezier(0.4, 0, 1, 1)', '--duration-panel: 250ms' -> 1 each (close-out re-run)"
        status: pass
      - kind: other
        ref: "npm run build -> 'Compiled successfully', postbuild contrast 24/24 (Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Motion durations and easings shared by CSS and lib/animations.ts, held in parity by a Jest test; cssDuration/cssEase helpers"
    requirement: DSGN-08
    verification:
      - kind: unit
        ref: "lib/__tests__/motion-tokens.test.ts -> 13 passed (6 duration, 5 easing, cssDuration('fast'), cssEase('descent')) (close-out re-run)"
        status: pass
      - kind: other
        ref: "grep lib/animations.ts: 'export const|function cssDuration|cssEase' -> 2; 'fast: 0.15|panel: 0.25' -> 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "MotionConfig reducedMotion=\"user\" with DURATION.enter and EASING.geological wraps the app"
    requirement: DSGN-08
    verification:
      - kind: other
        ref: "grep -cE 'reducedMotion=\"user\"|DURATION\\.enter' components/providers/MotionProvider.tsx -> 3; app/layout.tsx mounts MotionProvider around {children}"
        status: pass
      - kind: other
        ref: "npm run lint (0 errors) && npm run type-check && npx jest --silent (9 suites, 82 tests) && npm run build (Task 1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "v1 amber tokens removed; the single usage reads to-caution with no alias"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "grep -rEn 'amber-[0-9]' app components lib data | wc -l -> 0; grep -c to-caution components/FeatureShowcase.tsx -> 1 (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "CI Visual Regression green on cd5ac18 with no baseline change (zero-diff instead of the planned clix-cli/clix-website re-baseline)"
    requirement: DSGN-06
    verification:
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha cd5ac18a5f91f267067ad7dcf6989161c087e3ad --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39812748235/job/119943093773, exit 0"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha cd5ac18a5f91f267067ad7dcf6989161c087e3ad --none -> 'snapshot-commit: OK (0 changed)', exit 0"
        status: pass
      - kind: other
        ref: "'Update visual baselines' run 39812756834 on ci/07-09 (suite visual, update_mode changed) -> success; blob-compare vs HEAD: 0 of 72 PNGs changed, none added or removed"
        status: pass
    human_judgment: true
    rationale: "The visual gate passing does not prove the gradient renders as intended: the to-caution shift (YIQ ~355) is below Playwright's default per-pixel threshold 0.2 (~1409), so the gate is blind to it. Tim reviewed the analysis and chose option A (accept zero-diff)"
  - id: D6
    description: "Under prefers-reduced-motion: reduce, no essential content or shell element keeps translating or scaling; motion settles to its final state (plan prohibition)"
    requirement: DSGN-08
    verification: []
    human_judgment: true
    rationale: "The prohibition's verification is 'judgment' by design. MotionConfig reducedMotion=\"user\" plus the view-transition / scroll-behavior media rule implement it, and the reduced-motion visual baselines are unchanged, but no test asserts motion end-states"

duration: 19 min (2026-10-22T16:12:07Z to 16:31Z), including the CI run, the baseline workflow and Tim's option-A decision
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 09: Tokens v2 (L1 primitives + L2 semantic), shared motion tokens with a parity test, MotionConfig, amber -> caution

**One commit (`cd5ac18`) adds the tokens v2 L1 OKLCH primitives and 16 L2 semantic tokens to `app/globals.css`, plus duration and easing tokens that `lib/animations.ts` mirrors key for key. A 13-test Jest parity check holds the two in sync. The commit also wraps the app in `MotionConfig reducedMotion="user"` and renames the only v1 amber usage to `to-caution`. CI Visual Regression passed with zero PNG changes. The colour shift is real, but it falls under Playwright's default per-pixel threshold of 0.2, so Tim accepted the zero-diff outcome (option A).**

## Performance

- **Duration:** 19 min wall clock. Most of it was CI run 39812748235, the baseline run 39812756834 and Tim's decision.
- **Started:** 2026-10-22T16:12:07Z
- **Completed:** 2026-10-22T16:31Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 6 (2 created, 4 modified). No baseline PNGs.

## Accomplishments
- **Tokens v2 (DSGN-06 foundation).**
  - `:root` holds the L1 primitives: `--night-950/900/850/700/500`, `--firn-50`, `--mist-300`, `--glacier-300/400/500`, `--signal-400`, `--caution-400`, `--meadow-400` and `--gallery-black`.
  - `@theme inline` holds the 16 L2 semantic tokens, each a `var()` onto an L1 primitive, except `--color-contour`, which is a literal OKLCH value with alpha.
  - The other v1 tokens are untouched. Retargeting them is 07-10 (sub-commit 7b).
- **Shared motion tokens (DSGN-08 foundation).**
  - `--duration-fast/panel/hover/fracture/enter/settle` live in `:root`, and `--ease-geological/crystallize/tectonic/erosion/descent` live in `@theme static`.
  - `lib/animations.ts` gains `DURATION.fast` (0.15), `DURATION.panel` (0.25), `EASING.descent`, and the `cssDuration()` / `cssEase()` helpers, which return `var(--duration-*)` / `var(--ease-*)`.
  - `lib/__tests__/motion-tokens.test.ts` matches every key by name, so the order of keys in either file does not matter. It passes 13/13.
- **MotionConfig.** `components/providers/MotionProvider.tsx` (`'use client'`) renders `MotionConfig reducedMotion="user"` with `transition={{ duration: DURATION.enter, ease: [...EASING.geological] }}`. `app/layout.tsx` mounts it around `{children}`, with ServiceWorkerRegistration, Analytics and SpeedInsights left outside. It adds no DOM element.
- **Reduced motion.** A new `prefers-reduced-motion: reduce` rule turns off `::view-transition-group/old/new(*)` animations and sets `html { scroll-behavior: auto }`. The existing universal keyframe rule is kept.
- **amber -> caution.** The three `--color-amber-*` tokens are gone with no alias. FeatureShowcase's one gradient stop now reads `to-caution`. A grep for `amber-[0-9]` across app, components, lib and data finds nothing.
- **Visual gate.**
  - CI run 39812748235 on cd5ac18 passed every job, Visual Regression included. Dependency Review was skipped.
  - "Update visual baselines" (run 39812756834, update_mode=changed) rewrote 0 of 72 PNGs.

## Task Commits

1. **Task 1 (tracer): Tokens v2 + motion tokens end to end** - `cd5ac18` (feat). The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Re-baseline the project detail pages and confirm CI green** (checkpoint, blocking-human). Resolved as zero-diff (option A), so there is no commit and no PNG change.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `app/globals.css`: L1 primitives and duration tokens in `:root`, L2 semantic tokens in `@theme inline`, easings in `@theme static`, amber tokens removed, reduced-motion view-transition rule
- `lib/animations.ts`: `DURATION.fast`, `DURATION.panel`, `EASING.descent`, `cssDuration()`, `cssEase()`
- `lib/__tests__/motion-tokens.test.ts` (new): CSS/JS motion parity test
- `components/providers/MotionProvider.tsx` (new): MotionConfig wrapper
- `app/layout.tsx`: mounts MotionProvider around `{children}`
- `components/FeatureShowcase.tsx`: `to-amber-500` -> `to-caution`

## Decisions Made
- **Zero-diff accepted (option A).** The `to-caution` stop is rendered on the clix-cli page: "Intelligent caching (40-60% API cost reduction)" maps to the `caching` icon gradient. The colour moves from about sRGB (227,174,40) to (241,196,94). That shift is below the visual gate's per-pixel threshold, so nothing was re-baselined. Tim chose to accept that rather than force a re-baseline.
- **No amend, no force-push.** The commit body still says a re-baseline of clix-cli/* and clix-website/* is expected. Amending it would have needed a force-push to `ci/07-09`.
- **ui-ux-pro-max was loaded before the Task 1 edits.** Its guidance matched the locked UI-SPEC values, so nothing changed because of it.

## Deviations from Plan

None of these is an auto-fix of plan scope. Deviation 3 is the only Rule 1-3 fix.

**1. [Checkpoint outcome - Tim's decision] Task 2 is zero-diff, not the planned narrow re-baseline**
- **Found during:** Task 2
- **Issue:** The plan expected the `to-caution` stop to change the clix-cli and clix-website baselines. CI Visual Regression passed on cd5ac18, and "Update visual baselines" (update_mode=changed) rewrote 0 of 72 PNGs. Nothing was added or removed.
- **Root cause:**
  - The old `--color-amber-500` was oklch(0.78 0.15 85), about sRGB (227,174,40). The new `--caution-400` is oklch(0.84 0.13 85), about sRGB (241,196,94).
  - pixelmatch's YIQ delta at the pure end stop is about 355.
  - Playwright's default `threshold: 0.2` only flags a pixel above 35215 × 0.2² ≈ 1409. A per-pixel threshold of about 0.10 would catch this shift.
  - `playwright.config.ts` sets `toHaveScreenshot: { animations: 'disabled', caret: 'hide' }` ("Zero tolerance: default threshold, no maxDiffPixels"). That means zero differing pixels, but each pixel still has a 0.2 colour tolerance.
  - So no pixel counts as different, the test passes, and `--update-snapshots=changed` writes nothing.
- **Resolution:** Tim chose option A: accept zero-diff, with no PNG change, no amend and no force-push. An `update_mode=all` diagnostic dispatch was denied by the session's permission classifier and never ran.
- **Acceptance used instead:** `check-snapshot-commit --sha cd5ac18... --none` replaced the plan's `--allow clix-cli --allow clix-website --some`, which cannot pass when no PNG changes. `check-visual-run` was run on the explicit SHA cd5ac18.
- **Verification:** `snapshot-commit: OK (0 changed)`, exit 0. `check-visual-run` printed PASS, job 119943093773, exit 0. Both were re-run at close-out.

**2. [Commit message - left as is] The cd5ac18 body describes a re-baseline that turned out to be unnecessary**
- **Issue:** The body line "Re-baseline: FeatureShowcase gradient stop amber-500 -> caution-400 (7a); expected changes: clix-cli/* and clix-website/* only." comes verbatim from the plan. No baseline changed.
- **Resolution:** It was deliberately not amended, because that would have needed a force-push to `ci/07-09`. This SUMMARY is the record of truth.

**3. [Rule 3 - Blocking] The first parity-test draft was written through a Bash heredoc, which collapsed the regex escapes**
- **Found during:** Task 1
- **Issue:** The heredoc turned `\\s` / `\\d` into broken escapes, and 11 tests failed.
- **Fix:** The file was rewritten with the Write tool before the commit.
- **Files modified:** `lib/__tests__/motion-tokens.test.ts`
- **Verification:** 13/13 pass, re-run at close-out.
- **Committed in:** `cd5ac18`. The committed file is correct.

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking), 1 checkpoint outcome decided by Tim (zero-diff), 1 commit message left as is.
**Impact on plan:** Every must_have truth holds except the literal "re-baselined in the same commit". The gradient stop is the only intended visual change, but it is below the gate's per-pixel threshold, so there was nothing to re-baseline. No scope creep.

## Issues Encountered
- The first `check-visual-run` attempt by the orchestrator printed MISSING (exit 2), because GitHub's `actions/runs?head_sha=` index lagged a few minutes. The retry passed, and so did the close-out re-run.
- **Observations, all left alone and out of scope:**
  - A dead `.to-amber-500` rule (Tailwind stock amber, #f99c00) is still emitted. Tailwind v4's source scan reads the tracked `.planning/` docs, which mention it. No DOM element uses the rule. A possible later fix is `@source not` for `.planning`.
  - `scripts/verify-contrast.mjs` still has `amber-*` entries in its hand-written hex table. RESEARCH already marks that table as deprecated.
  - The "Ember accent (amber/gold -- sunrise)" comment in globals.css was kept.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-15 (CSS/JS motion-token drift):** mitigated. `motion-tokens.test.ts` fails on any missing or differing value.
- **T-07-SC (npm installs):** not applicable. No packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this is what keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-10** (sub-commit 7b, retargeting the v1 tokens). The L1/L2 tokens it retargets onto now exist.
- **Concern for Tim (regression risk, not acted on):** the visual guard (GUARD-02) uses Playwright's default per-pixel `threshold: 0.2`.
  - It can miss token colour shifts of this size: a per-pixel YIQ delta up to about 1409 passes.
  - That matters for 07-10 (7b, token retarget) and for any later plan that relies on "zero visual diff" to prove a change is colour-neutral. A retarget that shifts colours slightly would pass silently.
  - **Option:** set `threshold` to 0 or 0.1 in `playwright.config.ts` `expect.toHaveScreenshot`. Renders in the CI container are deterministic (in 07-08 the re-renders were pixel-identical), so a tighter threshold should not cause flakes. It would need its own verification run, and possibly an approved re-baseline.
  - **Secondary effect:** with `--update-snapshots=changed`, sub-threshold drift is never written to the baselines. The clix-cli baselines now differ slightly from the true render, in the caching icon gradient. A tightened threshold would flag those PNGs first.
- **Still open from 07-07:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. Merge recommended soon.
- **Pushing:** `cd5ac18` is on `origin/ci/07-09`. The docs commits stay local.

## Verification (close-out, 2026-10-22T16:31Z)

| Check | Result |
|-------|--------|
| `node scripts/ci/check-snapshot-commit.mjs --sha cd5ac18a5f91f267067ad7dcf6989161c087e3ad --none` | `snapshot-commit: OK (0 changed)`, exit 0 |
| `check-visual-run.mjs --sha cd5ac18a5f91f267067ad7dcf6989161c087e3ad --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39812748235/job/119943093773`, exit 0 |
| `npx jest lib/__tests__/motion-tokens.test.ts` | 13 passed, 13 total |
| `grep -rEn 'amber-[0-9]' app components lib data \| wc -l` | 0 |
| globals.css acceptance strings (6) | 1 match each |
| `lib/animations.ts` cssDuration/cssEase exports; `fast: 0.15` / `panel: 0.25` | 2 / 2 |
| MotionProvider `reducedMotion="user"` / `DURATION.enter` | present |
| FeatureShowcase `to-caution` | 1 |
| `git status --short public/` | clean (service-worker.js restored) |
| Task 1: lint / type-check / jest / build | exit 0 (0 errors, 54 pre-existing warnings) / exit 0 / 9 suites, 82 tests / "Compiled successfully", contrast 24/24 |
| `git ls-remote origin refs/heads/ci/07-09` | cd5ac18a5f91f267067ad7dcf6989161c087e3ad |
| `requirements.ready-ids` DSGN-06 DSGN-08 | ready [], blocked [DSGN-06, DSGN-08] |

## Self-Check: PASSED
- `cd5ac18` is an ancestor of HEAD. `git rev-list --count ea9ccf8..cd5ac18` = 1, measured from the plan ledger.
- Both created files exist (`lib/__tests__/motion-tokens.test.ts`, `components/providers/MotionProvider.tsx`), and the 4 modified files contain the stated changes.
- Every Task 1 acceptance criterion was re-run at close-out and passes. The Task 2 acceptance passes in its zero-diff form (deviation 1).
- Plan-level verification: the parity test is green, no amber token or usage remains, the build is green (Task 1), and CI Visual Regression is green with 0 PNGs changed.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
