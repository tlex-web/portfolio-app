---
phase: 07-foundation-guardrails
plan: 11
subsystem: ui
tags: [typography, schibsted-grotesk, next-font, tailwind-v4, base-layer, tabular-nums, focus-visible, cls, visual-regression, re-baseline, dsgn-07]

requires:
  - phase: 07-10
    provides: "v1 colour tokens as @theme inline aliases of tokens v2, and body on --color-ink / --color-surface, which the 7c base rules build on"
  - phase: 07-09
    provides: "L2 semantic tokens (--color-ink, --color-ink-muted, --color-accent, --color-accent-hover, --color-focus) used by the new base rules"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml"
provides:
  - "Schibsted Grotesk self-hosted through next/font/google (--font-schibsted, display swap, adjustFontFallback) on <html>, exposed as --font-display; --font-heading is a deprecated alias of it"
  - "--text-heading* and --text-display* theme tokens (text-heading, text-display, font-display utilities)"
  - "@layer base type stack: body Inter 16/24; h1 Schibsted 40/44 600 -0.02em ink, balance, no text-shadow; h2 Schibsted 24/32 600; h3/h4 Inter 16/24 600; small/.caption 14/20 ink-muted; tabular-nums on code/kbd/samp/pre/.font-mono; prose links; 2px focus-visible ring"
  - "e2e/design-system.spec.ts: 5 tests (computed families, injected bare h1 base rule, tabular figures, CLS < 0.1 @chromium-only on /, /photos, /projects)"
  - "70 of 72 visual baselines re-baselined for the type stack in the 7c commit"
  - "Visual guard per-pixel threshold 0.01 (was 0), which absorbs ±1-level anti-aliasing noise and still fails every real regression seen so far"
affects: [07-12, 07-14, 07-20, 07-21, 07-22, phase-09, phase-10, phase-11, phase-12]

actuals:
  tokens: 3328    # chars/4 over the text diff d063564..2d96f50 (13311 chars: app/globals.css, app/layout.tsx, components/RoadmapTimeline.tsx, e2e/design-system.spec.ts, playwright.config.ts, e2e/visual/README.md); the 70 PNGs are binary and not counted
  tasks: 2
  commits: 2      # measured: git rev-list --count d0635643..2d96f50 (497780d, 2d96f50), before the docs commits
plan_head_before: d0635643ce3dacb119d534bb96ba43cca0b4b68a
plan_head_after: 2d96f50399d2e159cf9a98b5baf22192356633f2

tech-stack:
  added: ["Schibsted Grotesk (next/font/google, self-hosted at build; no npm package)"]
  patterns:
    - "Base element rules live in @layer base, so any Tailwind utility on an element beats them; a base rule is proven on an injected bare element, and a real page only proves what no utility overrides (the family)"
    - "A font swap can change flex min-content widths: check flex-1 text columns next to fixed-width pills at 375 px after any family change"
    - "Visual guard threshold 0.01: tolerates ±1 RGB level of AA noise; anything a real token, glyph or palette change produces still fails"

key-files:
  created:
    - e2e/design-system.spec.ts
  modified:
    - app/layout.tsx
    - app/globals.css
    - components/RoadmapTimeline.tsx
    - playwright.config.ts
    - e2e/visual/README.md
    - e2e/visual/routes.spec.ts-snapshots/** (70 PNGs across all 9 route folders)

key-decisions:
  - "Option D (Tim): heading utilities beat the @layer base rules. The weight/size/no-glow assertions moved to an injected bare <h1> that proves the base rule; the real-page check asserts only the Schibsted family. 37 utility-styled headings in 20 files keep their weight, glow and colour until Phases 9-12; for them 7c changes only the family (plus balance on h1). The plan/UI-SPEC line 'only family, weight, colour and glow change for them' is inaccurate. Rejected: B (sweep 20 files), A (fix only the home h1), C (!important)"
  - "RoadmapTimeline badge fix (Tim's option A), folded into the 7c commit: whitespace-nowrap on the 3 badge spans, because the narrower Schibsted card heading no longer held the flex-1 header column open at 375 px and the badges wrapped internally. Medium Priority release pills now sit up to ~9 px into the card's right padding without clipping (Tim accepted)"
  - "Visual threshold 0 -> 0.01 (Tim's option A), separate commit 2d96f50: roadmap/1440-reduced-visual-light flips between two renders 9 px apart (±1 RGB level, AA edge of the 'v2.5.0' pill) that includeAA:false does not exclude. Verified with Playwright's own comparator: 0.01 passes the flake and still fails the 07-09 caution stop (1953 px), the 07-08 textarea grabber (36 px) and the 07-10 palette shift. No baselines changed"
  - "70 of 72 baselines re-baselined in the 7c commit (home/768-scroll-50 dark and light have no heading in view and are unchanged); Tim amended de341ed -> 497780d and force-pushed with lease"
  - "Acceptance used per-slug check-snapshot-commit --allow across all 9 routes (Tim's standing rule, stricter than a broad check)"
  - "DSGN-07 marked Complete: requirements.ready-ids reports it ready, because 07-11 is the only plan that declares it"

patterns-established:
  - "Base-rule tests inject a bare element (no class) and read its computed style; real-page tests assert only what no utility can override"
  - "Type-stack CLS is measured with a buffered PerformanceObserver('layout-shift') registered via addInitScript, summed after document.fonts.ready + 1 s, excluding hadRecentInput"

# Copied verbatim from the PLAN's `requirements`. DSGN-07 IS flipped to Complete in
# REQUIREMENTS.md: requirements.ready-ids reports it ready (07-11 is its only declaring plan).
requirements-completed: [DSGN-07]

coverage:
  - id: D1
    description: "Schibsted Grotesk is self-hosted through next/font/google (--font-schibsted, display swap, adjustFontFallback) on <html> (no `dark` class) and exposed as --font-display; --font-heading is a deprecated alias"
    requirement: DSGN-07
    verification:
      - kind: other
        ref: "grep app/layout.tsx: Schibsted_Grotesk (2), --font-schibsted (1), html className `${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable}` (no `dark`); grep -F app/globals.css '--font-display: var(--font-schibsted)' (1) (close-out re-run)"
        status: pass
      - kind: e2e
        ref: "e2e/design-system.spec.ts#live h1 on / uses Schibsted (CI E2E Tests job, run 39851101533)"
        status: pass
      - kind: other
        ref: "npm run build (Schibsted downloaded at build, self-hosted; CSP font-src 'self' unchanged) (Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The @layer base rules: h1 Schibsted 40/44 600 -0.02em ink, balance, no text-shadow; h2 Schibsted 24/32 600; h3/h4 Inter 16/24 600; body Inter 16/24"
    requirement: DSGN-07
    verification:
      - kind: e2e
        ref: "e2e/design-system.spec.ts#injected bare <h1> computes Schibsted, weight 600, 40px/44px, text-shadow none (CI run 39851101533; local Chromium 5/5)"
        status: pass
      - kind: e2e
        ref: "e2e/design-system.spec.ts#body uses Inter (CI run 39851101533)"
        status: pass
      - kind: other
        ref: "awk over the app/globals.css h1 rule: no text-shadow (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D3
    description: "text-heading and text-display tokens exist with their line-height and letter-spacing"
    requirement: DSGN-07
    verification:
      - kind: other
        ref: "grep -F app/globals.css '--text-display--line-height: 2.75rem' (1) (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D4
    description: "JetBrains Mono is data-only and always tabular: code, kbd, samp, pre and .font-mono compute tabular-nums"
    requirement: DSGN-07
    verification:
      - kind: e2e
        ref: "e2e/design-system.spec.ts#injected <code> uses tabular-nums and JetBrains (CI run 39851101533)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Global focus-visible rule: 2px var(--color-focus) outline, 2px offset"
    verification:
      - kind: other
        ref: "grep -F app/globals.css 'outline: 2px solid var(--color-focus)' (1) (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Layout-shift sum < 0.1 on /, /photos and /projects after the 7c type commit"
    requirement: DSGN-07
    verification:
      - kind: e2e
        ref: "e2e/design-system.spec.ts#layout shift stays below 0.1 @chromium-only (CI E2E Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39851101533/job/120077175746; local dev server CLS 0.0000 on all 3 routes)"
        status: pass
    human_judgment: false
  - id: D7
    description: "If Schibsted fails to load, the size-adjusted fallback keeps heading layout shift under 0.1 (adjustFontFallback)"
    requirement: DSGN-07
    verification:
      - kind: other
        ref: "adjustFontFallback: true in app/layout.tsx; the CLS test runs with the font loaded, not with a forced font failure"
        status: pass
    human_judgment: true
    rationale: "Plan marks this truth 'verification: backstop'; no test blocks the font request, so the fallback path holds by configuration, not by a measurement"
  - id: D8
    description: "The type change is its own commit and every affected route is re-baselined in it, with the reason stated"
    requirement: DSGN-07
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 497780d3c78d36954067055ebfaba6082dda6b41 --some --allow clix-cli --allow clix-website --allow contact --allow home --allow not-found --allow offline --allow photos --allow projects --allow roadmap -> 'snapshot-commit: OK (70 changed)', exit 0 (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 2d96f50399d2e159cf9a98b5baf22192356633f2 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39851101533/job/120077175150, exit 0 (close-out re-run)"
        status: pass
      - kind: other
        ref: "Orchestrator review of baseline runs 39837333492 and 39842536356: 70/72 changed, 70/70 deterministic against the CI actuals, height changes by reflow only, 375 px contact sheet shows balanced Schibsted headings with no clipping or overflow"
        status: pass
    human_judgment: true
    rationale: "Whether the re-baselined headings read as intended is a visual judgement. Tim reviewed the artifact page by page and amended the PNGs into the commit (checkpoint resolved 'pushed')"

duration: 2h 48m (2026-10-22T18:54:41Z to 21:43Z), including 3 CI runs, 2 baseline runs, the roadmap badge fix, Tim's review and amend, and the threshold follow-up
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 11: Schibsted Grotesk display face, @layer base type stack and design-system e2e checks, 70 baselines re-baselined (7c)

**Commit `497780d` self-hosts Schibsted Grotesk through `next/font/google` as `--font-display`. It replaces the `@layer base` element rules with the UI-SPEC type stack: Schibsted h1/h2 at weight 600 with no glow, Inter body and h3/h4, tabular JetBrains Mono for data, prose links and a 2px focus ring. A new `e2e/design-system.spec.ts` checks the computed families, the base h1 rule on an injected bare element, tabular figures, and CLS < 0.1 on `/`, `/photos` and `/projects`. The same commit carries the RoadmapTimeline badge `whitespace-nowrap` fix and the 70 re-baselined PNGs Tim reviewed. A follow-up commit, `2d96f50`, sets the visual threshold to 0.01 so ±1-level anti-aliasing noise no longer flakes the guard. CI run 39851101533 passes every job.**

## Performance

- **Duration:** 2h 48m wall clock. Most of it was CI (E2E took 52 and 59 min because the runner's "Install Playwright browsers" step was slow), the two baseline runs and Tim's review.
- **Started:** 2026-10-22T18:54:41Z
- **Completed:** 2026-10-22T21:43Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 76: 5 source/test/config files, 1 new spec and 70 baseline PNGs

## Accomplishments
- **Display face (DSGN-07).** `app/layout.tsx` loads `Schibsted_Grotesk` (`--font-schibsted`, `display: 'swap'`, `adjustFontFallback: true`) and puts `schibsted.variable` on `<html>` next to Inter and JetBrains Mono. There is no `dark` class; that arrives in 07-14. `--font-display` points at it, and `--font-heading` is a `@deprecated v1 alias, removed in Phase 12`. The font is downloaded at build and served from the same origin, so CSP `font-src 'self'` is unchanged (T-07-17).
- **Type tokens.** `--text-heading` (1.5rem/2rem, -0.01em) and `--text-display` (2.5rem/2.75rem, -0.02em) give the `text-heading` and `text-display` utilities.
- **Base element styles.**
  - body: Inter 16/24, ink on surface.
  - h1: Schibsted 40/44, weight 600, -0.02em, ink, `text-wrap: balance`, no text-shadow.
  - h2: Schibsted 24/32, weight 600. h3 and h4: Inter 16/24, weight 600.
  - `small` and `.caption`: 14/20, ink-muted.
  - `tabular-nums` on `code, kbd, samp, pre, .font-mono`.
  - Prose links: accent colour, underlined, accent-hover on hover.
  - `:focus-visible`: 2px `--color-focus` outline with a 2px offset.
  - The `--text-shadow-glow*` tokens stay defined, but no base rule uses them.
- **Design-system spec.** `e2e/design-system.spec.ts` has 5 tests:
  1. The live h1 on `/` uses Schibsted.
  2. An injected bare `<h1>` computes Schibsted, weight 600, 40px/44px and `text-shadow: none`.
  3. body uses Inter.
  4. An injected `<code>` uses `tabular-nums` and JetBrains.
  5. `layout shift stays below 0.1 @chromium-only` on `/`, `/photos` and `/projects`, with a buffered `PerformanceObserver` and `document.fonts.ready` + 1 s.

  It passes 5/5 locally on Chromium (CLS 0.0000 on all 3 routes) and in CI.
- **Type-stack re-baseline.** 70 of 72 shots changed. `home/768-scroll-50` dark and light have no heading in view and did not change. Page heights changed by reflow only: clix-cli 375 −96, clix-website 375 −42, contact −10/−29/−43, roadmap 375 −140 net (10221 → 10081 after the badge fix). Headings render in Schibsted, balanced, wrap less, and nothing clips or overflows at 375 px.
- **Visual guard hardened against AA noise.** Threshold 0.01 ends the roadmap 1440-light flake. Every real regression the guard has caught so far would still fail.

## Task Commits

1. **Task 1 (tracer): Schibsted + base element styles, proven by computed-style e2e checks.** Originally `e067b1c` (feat, 3 files). The orchestrator amended it to `de341ed` to fold in the RoadmapTimeline badge fix (deviation 2). The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Re-baseline for the type stack, reviewed page by page, CI green** (checkpoint, blocking-human). Tim amended `de341ed` with the 70 reviewed PNGs (`--no-edit`) and force-pushed with lease, giving **`497780d`**. Tasks 1 and 2 share that commit. The follow-up **`2d96f50`** (`test(07): visual threshold 0.01 absorbs anti-aliasing noise (GUARD-02)`) changes `playwright.config.ts` and `e2e/visual/README.md` (deviation 3).

`e067b1c` and `de341ed` were rewritten and are not in branch history. `git rev-list --count d063564..2d96f50` = 2.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `app/layout.tsx`: the Schibsted_Grotesk loader and `schibsted.variable` on `<html>`.
- `app/globals.css`: `--font-display`, the deprecated `--font-heading` alias, `--text-heading*` and `--text-display*`, and the new `@layer base` type stack, tabular figures, prose links and focus ring.
- `e2e/design-system.spec.ts` (new): DSGN-07 computed-style checks and the G1 CLS check (`@chromium-only`).
- `components/RoadmapTimeline.tsx`: `whitespace-nowrap` on the 3 status/priority/release badge spans (deviation 2).
- `playwright.config.ts`, `e2e/visual/README.md`: `toHaveScreenshot` threshold 0 → 0.01, with the reason (deviation 3).
- `e2e/visual/routes.spec.ts-snapshots/{clix-cli,clix-website,contact,home,not-found,offline,photos,projects,roadmap}/*.png`: 70 PNGs re-baselined (home 22, every other route 6; none added or removed).

## Decisions Made
- **Base rules vs utilities (Tim's option D).** See deviation 1. Base rules restyle only headings without competing utilities. Utility-styled headings get the new family (and balance on h1) now, and their weight, glow and colour change when Phases 9-12 redesign those pages.
- **Re-baseline review (orchestrator, then Tim).**
  - Baseline run 39837333492 on `e067b1c` (`ci/07-11`) changed 70/72 shots. All 70 were deterministic against the CI actuals of run 39837328235. The review found the roadmap 375 badge wrap.
  - After the fix, baseline run 39842536356 on `de341ed` (`ci/07-11-r2`) changed only roadmap/375 dark and light; the other 68 were byte-identical.
- **ui-ux-pro-max** was loaded before the Task 1 edits and raised no conflicts with the UI-SPEC type stack.

## Deviations from Plan

Tim approved every deviation below. None is an executor auto-fix.

**1. [Plan assumption - Tim's option D] Heading utilities beat the base rules**
- **Found during:** Task 1
- **Issue:** The must-have "h1 renders in Schibsted Grotesk 40/44 px, weight 600, -0.02em, ink colour, text-wrap balance and no text-shadow" assumed the base rules would restyle every heading. They can't, because Tailwind utilities beat `@layer base`. 37 headings in 20 files carry font-bold/font-medium/text-shadow-glow*/colour utilities. Examples:
  - the home h1 at `Hero3DMountain.tsx:65`: `font-bold text-snow-50 drop-shadow-2xl`;
  - the /projects h1/h2: `text-shadow-glow`;
  - /contact, /error, /not-found and /offline: `text-gray-900 dark:text-white`.
- **Resolution:** The weight, size and no-glow assertions moved to an injected bare `<h1>`, which proves the base rule. The real-page check asserts only the Schibsted family. The plan objective's line "only family, weight, colour and glow change for them" (from the UI-SPEC) is inaccurate: only the family (plus balance on h1) changes for utility-styled headings.
- **Rejected alternatives:** B (sweep the 20 files now), A (fix only the home h1), C (`!important` in the base rules).
- **Files modified:** `e2e/design-system.spec.ts`
- **Verification:** design-system spec 5/5 locally and in CI run 39851101533.
- **Committed in:** `497780d`
- **Follow-up:** a STATE concern for Phases 9-12.

**2. [Layout regression from the font swap - Tim's option A] RoadmapTimeline badges wrapped at 375 px**
- **Found during:** Task 2 (review of baseline run 39837333492)
- **Issue:** At 375 px the narrower Schibsted card heading no longer held RoadmapTimeline's `flex-1` header column open. The "Target Release" block widened, and the status/priority badges wrapped internally ("⚡ In / Progress", "🔴 High / Priority"), making each card 16 px taller. The cause is flex min-content width. The old monospace word "Scheduling" (about 120 px) held the column open; in Schibsted it is about 105 px. It was first misdiagnosed as the pill's font.
- **Fix:** `whitespace-nowrap` on the 3 badge spans in `components/RoadmapTimeline.tsx`, a 4th file beyond the plan's 3. The orchestrator folded it into the 7c commit.
- **Result:**
  - High Priority cards are back to their old layout.
  - The 6 Medium Priority cards ("🟡 Medium Priority", about 139 px, which already wrapped before 7c) now sit on one line. Their release pill sits up to about 9 px into the card's right padding (15-17 px from the border instead of 24), with no clipping. Tim accepted this.
- **Verification:** `RoadmapTimeline.test.tsx` passes (jest 82/82). eslint and type-check are clean on the file. Baseline run 39842536356 changed only roadmap/375.
- **Committed in:** `497780d` (via `de341ed`)

**3. [Guard flake - Tim's option A] Visual threshold 0 → 0.01, separate commit**
- **Found during:** Task 2 (CI 39844830742 on `497780d`)
- **Issue:** Visual Regression failed on exactly one shot, `roadmap/1440-reduced-visual-light`. It flips at random between two renders that differ in 9 pixels (x 1300-1301, y 837-856) by ±1 RGB level on the anti-aliased right edge of the "v2.5.0" release pill. It was also seen in 07-10 CI (the watch item) and in this plan's CI. Playwright's anti-aliasing detection (`includeAA: false`) does not exclude these pixels.
- **Fix:** `toHaveScreenshot` threshold 0 → 0.01 in `playwright.config.ts`, with the reason documented in `e2e/visual/README.md`.
- **Verification:**
  - Playwright's own comparator (`coreBundle.js` `utils.getComparator`) at threshold 0.01 passes the flake. It still fails the 07-09 caution stop alone (1953 px, which threshold 0.2 missed), the 07-08 textarea grabber (36 px) and the 07-10 palette shift.
  - No baselines changed.
  - CI 39851101533 on `2d96f50` passes every job.
- **Committed in:** `2d96f50`
- **Supersedes:** the STATE "[post-07-09]" decision (threshold 0) and the 07-10 watch item.

**4. [Acceptance - Tim's standing rule] Per-slug `--allow` across all 9 routes**
- **Issue:** The plan implies a broad snapshot-commit check. Tim's rule (since 07-03) is to list slugs explicitly, because `--allow-all` turns off the per-folder check.
- **Resolution:** `check-snapshot-commit --sha 497780d --some --allow` for all 9 slugs prints `snapshot-commit: OK (70 changed)`. Every committed blob matches the reviewed artifact.

---

**Total deviations:** 4, none of them auto-fixes: 1 plan-assumption correction (option D), 1 layout fix from the font swap (a 4th file), 1 guard-threshold follow-up commit, and 1 stricter acceptance command.
**Impact on plan:** Every must_have truth holds as amended by option D. The weight, size, no-glow and colour truth is proven for the base rule, not for utility-styled headings. The fallback-CLS truth is a backstop that holds by configuration. The scope grew by one component file (badge nowrap) and one config commit (threshold), both approved by Tim.

## Issues Encountered
- CI 39837328235 on `e067b1c`: E2E passed and Visual failed 70 of 72 shots, as expected before the re-baseline.
- CI 39844830742 on `497780d`: Visual failed only on the roadmap 1440-light AA flake (deviation 3). E2E passed but took 52 min.
- CI 39851101533 on `2d96f50`: every job passed. E2E took 59 min because the runner's "Install Playwright browsers" step was slow. That is infrastructure, not a test hang.
- `next dev` created an untracked `AGENTS.md` at the repo root. It is left untracked, and Tim has to decide whether to keep, commit or ignore it.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-17 (font loading):** mitigated as planned. next/font self-hosts Schibsted (same origin), so no visitor request goes to a font CDN, and CSP `font-src 'self'` is unchanged.
- **T-07-SC (npm installs):** not applicable. No packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-12.** The type stack is live, and `--font-display`, `text-heading` and `text-display` are available to new code.
- **For later plans:**
  - Phases 9-12: 37 utility-styled headings in 20 files still carry font-bold, glow and v1 colours (recorded as a STATE concern). They pick up the base rule when their utilities are removed.
  - Visual re-baselines now run at threshold 0.01. `update_mode=changed` still captures every change above ±1-level AA noise.
- **Still open:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. The required status checks, the hero badge contrast and the snow-50 hover concerns are unchanged.
- **Pushing:** `2d96f50` is on `origin/ci/07-11-r2`. The docs commits stay local.

## Verification (close-out, 2026-10-22T21:43Z)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha 2d96f50399d2e159cf9a98b5baf22192356633f2 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39851101533/job/120077175150`, exit 0 |
| `check-visual-run.mjs --sha 2d96f50399d2e159cf9a98b5baf22192356633f2 --job "E2E Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39851101533/job/120077175746`, exit 0 |
| `check-snapshot-commit.mjs --sha 497780d3c78d36954067055ebfaba6082dda6b41 --some --allow` × 9 slugs | `snapshot-commit: OK (70 changed)`, exit 0 |
| layout.tsx acceptance | `Schibsted_Grotesk` 2, `--font-schibsted` 1, html className has no `dark` |
| globals.css acceptance (4 strings) | 1 match each (`tabular-nums` 1) |
| h1 base rule | no `text-shadow` |
| design-system.spec.ts | `@chromium-only` 3, `layout-shift` 5, `Schibsted` present |
| PNGs in `d063564..2d96f50` | 70 modified (home 22, the other 8 routes 6 each), 0 added or deleted |
| Task 1: design-system spec / lint / type-check / jest / build | 5/5 (CLS 0.0000 ×3) / 0 errors (54 pre-existing warnings) / exit 0 / 9 suites, 82 tests / exit 0, contrast 24/24; `public/service-worker.js` restored |
| `requirements.ready-ids` DSGN-07 | ready [DSGN-07], blocked [] |

## Self-Check: PASSED
- `497780d` and `2d96f50` are ancestors of HEAD. `git rev-list --count d0635643..2d96f50` = 2, measured from the plan ledger.
- The created file `e2e/design-system.spec.ts` exists. The modified files contain the stated changes, and the 70 PNGs are in `497780d`.
- Every Task 1 acceptance criterion was re-run at close-out and passes. Both Task 2 acceptance commands pass against the explicit SHA `2d96f50`, and the per-slug snapshot check passes on `497780d`.
- Plan-level verification: the design-system spec is green (families, weight, tabular figures, CLS), and CI Visual and E2E are green after the reviewed re-baseline.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
