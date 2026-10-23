---
phase: 07-foundation-guardrails
plan: 18
subsystem: ui
tags: [tokens-v2, semantic-tokens, stock-palette, projects, clix, hologram-terminal, visual-regression, re-baseline, dsgn-06, guard-04, build-step-8c]

requires:
  - phase: 07-17
    provides: "The 8c map pattern (one route group per commit, mapping and re-baseline in the same reviewed commit) and the neutral-surface / outlined-status treatment"
  - phase: 07-15
    provides: "One colour value per property in every Projects class string (dark: pairs collapsed), so the mapping is one-to-one"
  - phase: 07-13
    provides: "Phosphor icons and visible labels on feature and highlight tiles, so categories stay readable without a per-category hue"
  - phase: 07-09
    provides: "The L2 semantic utilities (surface*, ink*, line*, accent*, success, caution, danger) via @theme inline --color-* tokens"
provides:
  - "Projects route group (app/projects/[slug]/page.tsx, TechStackDisplay, FeatureShowcase, ProjectHighlights, ProjectDetailClient, HologramTerminalDemo, HologramTerminal) on L2 semantic utilities only: stock palette count 198 -> 0; white/black utilities 29 -> 0, so the 07-20 white/black ratchet starts at 0 for this group"
  - "clix-cli/{375,768,1440} and clix-website/{375,768,1440}-reduced-visual-dark-linux.png re-baselined inside the mapping commit 2d87a01; projects/* and every other snapshot unchanged"
affects: [07-19, 07-20, 09, 11, 12]

actuals:
  tokens: 8704    # chars/4 over `git diff fa5fb81..2d87a01 -- app components` (34817 chars, 7 files, 105+/151-); the 6 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count fa5fb81..HEAD = 1 (2d87a01), before the docs commits
plan_head_before: fa5fb81c119283374b69cc481728b159905dc96b
plan_head_after: 2d87a015f21e8a16edff766ba127d95402f7381c

tech-stack:
  added: []
  patterns:
    - "Staged dark: removal, stage 3 (map): one route group per commit, the stock-to-semantic mapping and its re-baseline in the same reviewed commit"
    - "One accent-filled primary per page (GitHub); every other button is an outlined secondary (bg-surface-overlay text-ink border-line-strong)"
    - "No alpha tints: translucent panels, pills and glows become solid surface/line tokens; coloured shadow tints are dropped, neutral shadow-lg stays"
    - "Category identity by label and icon only: one chip class for every tech, one neutral tile for every feature/highlight icon"

key-files:
  created: []
  modified:
    - app/projects/[slug]/page.tsx
    - components/TechStackDisplay.tsx
    - components/FeatureShowcase.tsx
    - components/ProjectHighlights.tsx
    - components/ProjectDetailClient.tsx
    - components/HologramTerminalDemo.tsx
    - components/HologramTerminal.tsx
    - e2e/visual/routes.spec.ts-snapshots/clix-cli/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/clix-cli/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/clix-cli/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/clix-website/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/clix-website/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/clix-website/1440-reduced-visual-dark-linux.png

key-decisions:
  - "Projects mapped to semantic tokens in 2d87a01 (stock count 198 -> 0); the 6 clix-cli/clix-website visual-dark PNGs re-baselined in the same commit; CI run 40003018857 green (Visual, Unit, E2E)"
  - "Tim's D1-D6, answered 'All recommended': D1 = A neutral hero band and What's Next card with line border; D2 = A GitHub the one accent primary, Live Demo and Documentation secondary; D3 = A outlined status badge on neutral; D4 = A neutral tech chips and feature/highlight tiles (label + icon only); D5 = A no alpha tints; D6 i-A high risk = danger, ii-A neutral window dots, iii-B USER label muted with accent prompt/command; recorded in the 2d87a01 body"
  - "Page height grows by +2px (clix-website 375: +4px) from the D1 hero border-y and, at clix-website 375, the D2 Live Demo button border on its own wrapped row; not a layout regression"
  - "DSGN-06 and GUARD-04 stay Pending: requirements.ready-ids reports both blocked, because 07-19 and 07-20 also declare them and have no SUMMARY yet"

patterns-established:
  - "Dark ink on accent fails contrast (1.42:1); filled accent/success/caution/danger use text-ink-inverse (11.29/10.79/11.63/7.19:1)"
  - "Inline colours outside class strings (Three.js materials, <style jsx global>) are left for the redesign phase and listed, because the class grep cannot see them"

# Copied verbatim from the PLAN's `requirements`. DSGN-06 and GUARD-04 are NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports both blocked (07-19 and 07-20 also declare them and have no SUMMARY yet).
requirements-completed: [DSGN-06, GUARD-04]

coverage:
  - id: D1
    description: "Every stock Tailwind palette class in the Projects group is replaced by an L2 semantic utility (count 0)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "Task 1 <verify> stock-palette grep over the 7 group files | wc -l = 0 (198 at fa5fb81; close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No v1 alias, raw OKLCH, hex, rgba() or arbitrary colour value introduced by the mapping"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "git show 2d87a01 -- app components: added lines matching (alpine|granite|snow|frost|ember|pine|rust)-[0-9] | #hex | oklch( | rgba?( | (bg|text|border)-[ = 1 hit, text-[10px] (a font size, not a colour) -> 0 colour values (close-out re-run); v1 alias one-liner 'v1 alias count not increased 4 -> 4' (Task 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Tech-stack category chips and feature tiles use semantic tokens; categories stay distinguishable by text labels and icons, not by a stock hue"
    requirement: DSGN-06
    verification:
      - kind: unit
        ref: "npx jest --silent 9/9 suites, 82/82; npx playwright test e2e/projects.spec.ts --project=chromium 7 passed (Task 1)"
        status: pass
      - kind: unit
        ref: "CI Unit Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/40003018857/job/120583739417; E2E Tests PASS .../job/120583739924"
        status: pass
    human_judgment: true   # orchestrator crop review at 375/768/1440: identical outlined chips with labels, neutral tiles with icons, all text readable
  - id: D4
    description: "The mapping is its own commit, the clix-cli/* and clix-website/* snapshots are re-baselined in it with the reason stated, and no other snapshot changes"
    requirement: GUARD-04
    verification:
      - kind: other
        ref: "check-snapshot-commit.mjs --sha HEAD --allow clix-cli --allow clix-website --allow projects --some -> 'snapshot-commit: OK (6 changed)', exit 0; git show --name-status 2d87a01: 7 source M + 6 clix PNG M, 0 A, 0 D (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha 2d87a015f21e8a16edff766ba127d95402f7381c --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/40003018857/job/120583739221, exit 0 (close-out re-run)"
        status: pass
    human_judgment: true   # Tim reviewed the 6 clix PNGs (three crop sheets) and the height change before the amend (Task 2)

duration: about 46 min by commit timestamps (07-17 close-out fa5fb81 17:38:28Z to the amended commit 18:24:22Z), plus 1 baseline run and 2 CI runs; push CI on 2d87a01 finished 18:30:23Z
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 18: Projects route group mapped from stock palette to semantic tokens (build step 8c)

**Commit `2d87a01` replaces all 198 stock palette classes in the Projects group (`app/projects/[slug]/page.tsx`, `TechStackDisplay`, `FeatureShowcase`, `ProjectHighlights`, `ProjectDetailClient`, `HologramTerminalDemo`, `HologramTerminal`) with L2 semantic utilities, using Tim's choices D1-D6 (neutral surfaces, one accent primary, no alpha tints). It also re-baselines the 6 `clix-cli/*` and `clix-website/*` dark shots. CI run 40003018857 on `ci/07-18` passes Visual, Unit and E2E.**

## Performance

- **Duration:** about 46 min by commit timestamps (`fa5fb81` 17:38:28Z, task commit `3820742` authored 17:49:26Z, amend `2d87a01` committed 18:24:22Z). The baseline run 39998397082 finished at 17:56:10Z and the push CI run 40003018857 at 18:30:23Z.
- **Tasks:** 2/2
- **Files modified:** 13 (7 source, 6 PNG)

## Accomplishments
- **Mapping (DSGN-06, 8c Projects):** stock count went from 198 to 0 across the 7 files (per-file passes 174 -> 56 -> 13 -> 0). White/black utilities in the group went from 29 to 0, so the 07-20 white/black ratchet starts at 0 for this group.
- **Hero and What's Next (D1 = A + card border line):** the hero is `bg-surface-raised border-y border-line` with `text-ink` / `text-ink-muted`. The version pill is `bg-surface-overlay border-line-strong`. The What's Next card is flat with a `border-2 border-line` edge.
- **Buttons (D2 = A):** GitHub is the only `bg-accent text-ink-inverse` primary. Live Demo and Documentation are secondaries (`bg-surface-overlay text-ink border-line-strong`).
- **Status badge (D3 = A):** outlined on neutral, `bg-surface-overlay border` with `text-success` / `text-caution` / `text-accent`. The archived badge is `line-strong` / `ink-muted`.
- **Categories (D4 = A):** every tech chip uses one class, `bg-surface-overlay text-ink border-2 border-line-strong hover:border-accent`. Feature and highlight icon tiles are `bg-surface-overlay` with a `text-ink-muted` icon. Categories are told apart by label and icon only.
- **No alpha tints (D5 = A):** count pills, terminal panels, the play button, dividers, progress dots, the hologram banner, the 3D badge and the bottom label now use solid surface/line tokens. Coloured shadow tints are dropped.
- **Terminal (D6):** a high risk score is `danger` (i-A). Window-chrome dots are `bg-line-strong` (ii-A). The USER label and cursor are `ink-muted`, input is `ink`, and the prompt glyph and command are `accent` (iii-B).
- **Re-baseline:** Tim amended `clix-cli/*` and `clix-website/*` {375,768,1440}-reduced-visual-dark-linux.png into `2d87a01`. The commit body states the reason and Tim's choices.

## Task Commits

1. **Task 1 (tracer): Map the Projects group from stock palette to semantic tokens** - `2d87a01` (refactor). The pre-amend commit `3820742` had the same source change without PNGs.
2. **Task 2: Re-baseline the Projects snapshots and confirm CI green** (checkpoint:human-action, blocking-human). `ci/07-18` was first pushed at `3820742` (plain push, new branch). The "Update visual baselines" run 39998397082 (update_mode changed) succeeded, and against HEAD only clix-cli/* and clix-website/* differed (6 PNGs). The push CI run 39998398335 on `3820742` failed only Visual Regression, on those 2 slugs in the dark and light projects, as expected before the re-baseline. Tim amended the 6 PNGs (`2d87a01`), pushed and replied "pushged" (typo for "pushed"; the amend is on HEAD and on `origin/ci/07-18`). Push CI run 40003018857 was green. No separate commit.

`git rev-list --count fa5fb81..HEAD` = 1, measured from the plan ledger.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `app/projects/[slug]/page.tsx` - hero band, version pill, status badge, CTA buttons, What's Next card.
- `components/TechStackDisplay.tsx` - one neutral chip class; the per-tech hue map is gone.
- `components/FeatureShowcase.tsx` - neutral icon tiles, count pills and dividers.
- `components/ProjectHighlights.tsx` - neutral highlight tiles and muted icons.
- `components/ProjectDetailClient.tsx` - stock classes mapped (4 v1 aliases left, see Issues).
- `components/HologramTerminalDemo.tsx` - terminal panels, window dots, prompt, risk colours, play button, progress dots.
- `components/HologramTerminal.tsx` - banner and bottom label class strings (Three.js and global CSS colours untouched).
- `e2e/visual/routes.spec.ts-snapshots/{clix-cli,clix-website}/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined.

## Decisions Made
- **D1-D6 are Tim's choices.** He answered the Task 1 batched decision checkpoint in this session with "All recommended": D1 A + card border line, D2 A, D3 A, D4 A, D5 A, D6 i-A / ii-A / iii-B. The `2d87a01` body records them.
- **Contrast basis** (from the survey of the globals.css OKLCH values): dark ink on accent is 1.42:1, which fails, so D1 and D2 had options. `text-ink-inverse` on accent, success, caution and danger is 11.29, 10.79, 11.63 and 7.19:1. Accent, success, caution and danger text on `surface-raised` is 10.57, 10.10, 10.89 and 6.73:1. `ink-muted` on `surface-raised` / `surface-overlay` is 8.35 / 7.67:1. `line-strong` on `surface-raised` is 4.54:1. The lowest text pair in the result is 6.7:1.
- **projects/* not re-baselined:** the index (`app/projects/page.tsx`) renders none of the 7 components, and the blob compare confirmed its PNGs did not change.
- **DSGN-06 and GUARD-04 stay Pending.** `requirements.ready-ids 07-18-PLAN.md` returns `ready: [], blocked: [DSGN-06, GUARD-04]`: 07-19 and 07-20 also declare both and have no SUMMARY. `requirements-completed` copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.

## Deviations from Plan

None in the delivered result: stock count 0, only clix-cli/* and clix-website/* re-baselined, tests unmodified, CI green. Code-structure changes made while mapping:
- **TechStackDisplay:** the `techLogos` hue map and `getTechStyle()` are removed; every chip uses one class string (D4).
- **FeatureShowcase:** the iconMap `color` field is dropped; `FeatureIcon` is now `{ Icon }`.
- **`backdrop-blur-sm` dropped** on the version pill, the Documentation button, and the HologramTerminal banner and bottom label. Those elements are now opaque, so the blur had no visual effect.
- **Shadows:** neutral `shadow-lg` kept; coloured shadow tints dropped (D5).
- **Borders outside the table:** blue/cyan borders, which the mapping table does not list, map to `border-accent` by hue, extending the gradient-stop rule.

## Issues Encountered
- **Page height changed, not only colour:** clix-cli 1440 4963 -> 4965, 768 6345 -> 6347, 375 9217 -> 9219 px; clix-website 1440 4279 -> 4281, 768 5347 -> 5349, 375 8341 -> 8345 px. Row-profile alignment puts every shift inside the hero. The hero `border-y` (D1-A) adds 2px at every width. At clix-website 375 the newly bordered Live Demo button (D2-A) adds another 2px, because it sits on its own wrapped row. The outlined status badge (D3-A, +2px) does not change page height: its column sits beside the text block even at 375. Below the hero the shift is constant. The executor predicted this before the run; Tim reviewed it before the amend. It is not a regression.
- **Determinism:** the CI actual images are pixel-identical (0 px) to the baseline-run PNGs for all 12 shots (2 slugs x 3 widths x dark/light).
- **Inline colours left for Phase 9 (out of scope, UI-SPEC v2-only rule):** `components/HologramTerminal.tsx` Three.js material and light hex values (L26-330), and its `<style jsx global>` block with rgba/hex (L368-486), including the `.hologram-content` navy panel the terminal demo text sits on. The class grep does not see them.
- **v1 aliases left:** `components/ProjectDetailClient.tsx` still uses `snow-50`, `alpine-800`, `alpine-600` and `snow-100` (count 4 -> 4). The plan maps only stock classes; the aliases go when the v1 layer is removed (Phase 12).
- **Lint:** `npm run lint` exit 0; the 4 react-hooks warnings in these files were already there and none is on a touched line. `npm run type-check` exit 0.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-24 (Project detail rendering):** accepted as planned. Class-only edits, reviewed in the re-baseline; `e2e/projects.spec.ts` passes (7).
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-19** (8c map, group Photos + edge pages), with the same pattern: one mapping commit, re-baseline of that group's slugs only.
- **Pushing:** `2d87a01` is on `origin/ci/07-18`. The docs commits stay local.

## Verification (close-out, 2026-10-23)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha 2d87a015f21e8a16edff766ba127d95402f7381c --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/40003018857/job/120583739221`, exit 0 |
| `check-visual-run.mjs --sha 2d87a01… --job "Unit Tests" --wait 1` | `PASS …/runs/40003018857/job/120583739417`, exit 0 |
| `check-visual-run.mjs --sha 2d87a01… --job "E2E Tests" --wait 1` | `PASS …/runs/40003018857/job/120583739924`, exit 0 |
| `check-snapshot-commit.mjs --sha HEAD --allow clix-cli --allow clix-website --allow projects --some` | `snapshot-commit: OK (6 changed)`, exit 0 |
| `git show --name-status 2d87a01` | 13 M (7 source, 6 clix PNG), 0 A, 0 D |
| Task 1 stock-palette grep | 0 (198 at `fa5fb81`) |
| white/black utilities in the 7 files | 0 |
| v1 alias / hex / oklch / rgba / arbitrary colour in added lines | 0 (one regex hit is `text-[10px]`, a font size) |
| `requirements.ready-ids 07-18-PLAN.md DSGN-06 GUARD-04` | ready [], blocked [DSGN-06, GUARD-04] |

## Self-Check: PASSED
- `2d87a01` is an ancestor of HEAD; `git rev-list --count fa5fb81..HEAD` = 1 from the plan ledger.
- All 13 modified files exist and are within the plan's `files_modified` (7 source files + `clix-cli/**`, `clix-website/**`; `projects/**` unchanged).
- Task 1 automated stock grep and Task 2 acceptance commands re-run at close-out and pass.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
