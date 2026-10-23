---
phase: 07-foundation-guardrails
plan: 15
subsystem: ui
tags: [dark-mode, tailwind-v4, class-collapse, visual-regression, zero-diff, dsgn-05, build-step-8b]

requires:
  - phase: 07-14
    provides: "Class-based @custom-variant dark plus html.dark, so every visitor already rendered the dark: values; visual-light asserts against the visual-dark PNGs"
provides:
  - "Every `A dark:B` pair in the 18 files collapsed to `B`: 228 dark: tokens (177 lines) removed, 0 remain in app, components, lib, data, e2e"
  - "Zero visual diff proven in CI (run 39875749247: Visual, Unit, E2E green; 0 PNGs changed)"
  - "@custom-variant dark in app/globals.css is now unused by code (removed in 07-20)"
affects: [07-16, 07-17, 07-18, 07-19, 07-20, phase-11, phase-12]

actuals:
  tokens: 16262   # chars/4 over `git diff ef1d2b3..d114b42` (65046 chars, 18 files, 177+/177-)
  tasks: 3
  commits: 2      # measured: git rev-list --count ef1d2b3..HEAD = 2 (0951de8, d114b42), before the docs commits
plan_head_before: ef1d2b349669c04070ab420674e2b1c31356aeea
plan_head_after: d114b429fff17dd95c1d6389c123f503c6c90153

tech-stack:
  added: []
  patterns:
    - "Staged dark: removal, stage 2: once the dark: values apply to everyone (8a), the base values are dead branches and can be deleted with zero pixel change"
    - "Pair a dark: utility with its base only inside the same literal fragment, with identical other modifiers and the same colour property; an unpaired dark: utility just loses its prefix"

key-files:
  created: []
  modified:
    - app/contact/page.tsx
    - components/FeedbackForm.tsx
    - app/roadmap/page.tsx
    - components/RoadmapTimeline.tsx
    - components/RoadmapProgress.tsx
    - components/RoadmapFilters.tsx
    - app/offline/page.tsx
    - app/error.tsx
    - app/not-found.tsx
    - app/projects/[slug]/page.tsx
    - components/TechStackDisplay.tsx
    - components/FeatureShowcase.tsx
    - components/ProjectHighlights.tsx
    - components/ProjectDetailClient.tsx
    - app/photos/page.tsx
    - components/GalleryGrid.tsx
    - components/ImageDetailModal.tsx
    - components/InteractiveHotspot.tsx

key-decisions:
  - "The 8b collapse is zero-diff: all 228 dark: utilities are gone from code (scan set count 0), CI Visual green with 0 PNGs changed"
  - "Six unpaired dark: utilities (FeedbackForm.tsx:114/139/164 dark:bg-gray-800 dark:text-white on inputs with no base bg or text colour) were resolved by dropping the prefix"
  - "DSGN-05 stays Pending: requirements.ready-ids reports it blocked, because 07-20 also declares it and has no SUMMARY yet; @custom-variant dark and 41 phantom compiled dark: selectors remain"

patterns-established:
  - "dark: (:where(.dark,.dark *)) adds no specificity and won only on source order, so pseudo-class variants (hover/focus/disabled) still win after the collapse"

# Copied verbatim from the PLAN's `requirements`. DSGN-05 is NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports it blocked (07-20 also declares it and has no SUMMARY yet).
requirements-completed: [DSGN-05]

coverage:
  - id: D1
    description: "No dark: variant remains in app, components, lib, data or e2e; all 18 plan files hold only their former dark values"
    requirement: DSGN-05
    verification:
      - kind: other
        ref: "grep -rEn '(^|[^A-Za-z0-9_-])dark:' app components lib data e2e --include=*.ts --include=*.tsx --include=*.js --include=*.mjs | wc -l = 0 (close-out re-run); Task 1 group grep = 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Behaviour and tests unchanged: lint, type-check, Jest (9 suites / 82), guard:tests and build green, with no test edited or skipped"
    requirement: DSGN-05
    verification:
      - kind: unit
        ref: "npm run lint (0 errors) && npm run type-check && npx jest --silent (82 passed) && npm run build (Task 1-2); CI Unit Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39875749247/job/120160808494"
        status: pass
      - kind: e2e
        ref: "CI E2E Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39875749247/job/120160808162 (contact-form.spec unchanged, T-07-21)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The collapse is zero-diff: Visual Regression green on d114b42 with no re-baseline, and neither collapse commit touches a PNG"
    requirement: DSGN-05
    verification:
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha d114b429fff17dd95c1d6389c123f503c6c90153 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39875749247/job/120160808571, exit 0 (close-out re-run)"
        status: pass
      - kind: other
        ref: "check-snapshot-commit.mjs --sha d114b42… --none -> OK (0 changed); --sha 0951de8… --none -> OK (0 changed); git diff ef1d2b3..d114b42: 18 M, 0 PNG, 0 D (close-out re-run)"
        status: pass
    human_judgment: false

duration: 16 min (2026-10-22T23:57:24Z to 2026-10-23T00:13:15Z), including 1 CI run; no re-baseline
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 15: Every dark: pair collapsed to its dark value, zero visual diff (build step 8b)

**Commits `0951de8` and `d114b42` rewrite every `A dark:B` class pair to `B` in the 18 files that still used the variant: 228 `dark:` tokens on 177 lines go to 0 (Contact/Roadmap/edge-page group 132 -> 0, Projects/Photos group 96 -> 0). No file outside the plan's list had any. Because 07-14 already made every visitor render the `dark:` values, the dropped base classes were dead branches: CI run 39875749247 passes Visual, Unit and E2E on the first push with no PNG changed and no re-baseline.**

## Performance

- **Duration:** 16 min wall clock, including one CI run. No re-baseline.
- **Started:** 2026-10-22T23:57:24Z
- **Completed:** 2026-10-23T00:13:15Z (close-out verification)
- **Tasks:** 3/3
- **Files modified:** 18

## Accomplishments
- **Collapse (DSGN-05 stage 2).** In every class string (JSX className, template literals, config maps, conditionals) each `dark:` utility replaced the base utility it overrode, and lost its prefix. Class order and whitespace are otherwise unchanged; every change was reviewed in a word diff.
- **Pairing rule.** A `dark:` utility was paired with a base only when both sit in the same literal fragment, the other modifiers are identical, and the colour property matches (text, bg, border, from or to, with opacity). Nothing was left unclassified or with more than one candidate partner.
- **Unpaired `dark:` (6).** `FeedbackForm.tsx:114/139/164` carried `dark:bg-gray-800 dark:text-white` on inputs with no base bg or text colour; the prefix was dropped.
- **Config-map classes.** RoadmapTimeline status/area/priority configs, TechStackDisplay `style.bg`/`style.color` and the projects `statusColors` map were collapsed; their target elements carry no conflicting base utility.
- **Specificity is unchanged.** `dark:` compiled to `:where(.dark,.dark *)`, which adds no specificity, so it won on source order only. Pseudo-class variants (hover/focus/disabled) still win, e.g. ProjectHighlights `hover:border-cyan-500`. There were no media-only colour variants before the collapse.
- **Kept intact:** RoadmapTimeline's 3 `whitespace-nowrap`, the Phosphor icons, `aria-pressed`, `type="button"`, gradient direction classes.

## Task Commits

1. **Task 1 (tracer): Collapse dark: pairs in the Contact, Roadmap and edge-page group** - `0951de8` (refactor). 9 files, 132 -> 0. Tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Collapse dark: pairs in the Projects and Photos group** - `d114b42` (refactor). 9 files, 96 -> 0; whole-scan-set search found no other file.
3. **Task 3: Zero-diff gate** (checkpoint:human-action, blocking-human, resolved "pushed"). `d114b42` was plain-pushed to the new branch `ci/07-15`; CI run 39875749247 passed every job with a zero diff. No commit.

`git rev-list --count ef1d2b3..HEAD` = 2, measured from the plan ledger.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- Contact / Roadmap / edge pages: `app/contact/page.tsx`, `components/FeedbackForm.tsx`, `app/roadmap/page.tsx`, `components/RoadmapTimeline.tsx`, `components/RoadmapProgress.tsx`, `components/RoadmapFilters.tsx`, `app/offline/page.tsx`, `app/error.tsx`, `app/not-found.tsx` - class strings collapsed to their dark values.
- Projects / Photos: `app/projects/[slug]/page.tsx`, `components/TechStackDisplay.tsx`, `components/FeatureShowcase.tsx`, `components/ProjectHighlights.tsx`, `components/ProjectDetailClient.tsx`, `app/photos/page.tsx`, `components/GalleryGrid.tsx`, `components/ImageDetailModal.tsx`, `components/InteractiveHotspot.tsx` - class strings collapsed to their dark values.

## Decisions Made
- **The 8b collapse is zero-diff, and the `dark:` utilities are gone from code.** The scan set (app, components, lib, data, e2e; .ts/.tsx/.js/.mjs) counts 0. Outside it only `@custom-variant dark` (and its comment) in `app/globals.css`, removed in 07-20, and a prose comment in `playwright.config.ts:12` remain.
- **Unpaired `dark:` utilities lose their prefix** (the 6 FeedbackForm cases); that is the plan's rule and renders the same, because the variant already applied to everyone.
- **DSGN-05 stays Pending.** `requirements.ready-ids` returns `ready: [], blocked: [DSGN-05]`: 07-20 (remove `@custom-variant dark` and enable the guard) also declares it and has no SUMMARY. On the merits too: `@custom-variant dark` is still in `app/globals.css`, the compiled CSS still has 41 `dark:` selectors (see below), and no lint guard exists yet. `requirements-completed` copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.
- **ui-ux-pro-max** was loaded before the edits. Values were not changed (stock mapping is 07-16..07-19, the contrast guard 07-20). Observations for those plans:
  - FeedbackForm error `text-red-600` on the dark card is about 3.2:1, below 4.5:1;
  - input borders `border-gray-600` on `bg-gray-800` are about 1.9:1, below the 3:1 non-text minimum;
  - the inputs have no placeholder class, so the browser default under `color-scheme: dark` applies; the light base classes are gone. This closes the 07-14 placeholder/autofill concern;
  - `app/offline/page.tsx:61` `text-gray-500` on the gray-900/800 gradient is about 3.6:1 for small text;
  - `app/offline/page.tsx:15` icon `text-gray-600` is about 2.3:1, acceptable only if decorative;
  - RoadmapTimeline status cards `bg-*-900/20` separate weakly from the surface, so the border carries it;
  - passing: gray-400 on gray-800/900 (>= 5.7:1), the *-400 accents, green-200/red-200 on *-900, gray-200 on gray-700.

## Deviations from Plan

None - plan executed exactly as written. (Task 3's push used a plain push to the new branch `ci/07-15` instead of the plan's `--force` form, which is blocked in auto mode; the branch was new, so the effect is identical.)

## Issues Encountered
- **Found for 07-20 (not acted on):** the compiled CSS (`.next/static/chunks/*.css`) still contains 41 `:where(.dark,.dark *)` selectors (e.g. `dark:scale-0`, `dark:-rotate-90`, `dark:group-hover:text-cyan-400`) that no code uses. Tailwind v4's automatic source detection reads tracked Markdown: `.planning/milestones/v1.0-phases/04-design-components/04-03-PLAN.md`, `04-05-PLAN.md`, `04-RESEARCH.md` and `.claude/skills/ui-styling/references/shadcn-theming.md`. They have no visual effect, but a palette or `dark:` guard over the compiled CSS would count them, and the same mechanism produced 07-09's dead `.to-amber-500`. Fix: `@source not` for `.planning` and `.claude` in `app/globals.css`. Logged as a STATE concern.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-21 (contact form markup):** mitigated as planned. Only class strings changed; FeedbackForm.test and contact-form.spec ran unchanged (Jest 82 locally, CI Unit and E2E green).
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-16..07-19 (stock palette mapping per route group).** Each class string now holds a single colour value per property, so the mapping is one-to-one.
- **For 07-20:** remove `@custom-variant dark` (keep the html `dark` class), add `@source not` for `.planning` and `.claude` before any compiled-CSS guard, and check the contrast failures above (FeedbackForm error text 3.2:1, input borders 1.9:1, offline small text 3.6:1).
- **Pushing:** `d114b42` is on `origin/ci/07-15`. The docs commit stays local.

## Verification (close-out, 2026-10-23T00:13Z)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha d114b429fff17dd95c1d6389c123f503c6c90153 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39875749247/job/120160808571`, exit 0 |
| `check-visual-run.mjs --sha d114b42… --job "E2E Tests" --wait 1` | `PASS …/runs/39875749247/job/120160808162`, exit 0 |
| `check-visual-run.mjs --sha d114b42… --job "Unit Tests" --wait 1` | `PASS …/runs/39875749247/job/120160808494`, exit 0 |
| `check-snapshot-commit.mjs --sha d114b429fff17dd95c1d6389c123f503c6c90153 --none` | `snapshot-commit: OK (0 changed)`, exit 0 |
| `check-snapshot-commit.mjs --sha 0951de80f875b247503718b73d4374a39fb12ce2 --none` | `snapshot-commit: OK (0 changed)`, exit 0 |
| `git diff --name-status ef1d2b3..d114b42` | 18 M, 0 A, 0 D, 0 PNG; 177 insertions, 177 deletions |
| Scan-set `dark:` grep (Task 2 `<verify>`) | 0 |
| Task 1 group `dark:` grep | 0 |
| `public/service-worker.js` | clean |
| Task 1-2: lint / selftest / type-check / Jest / guard:tests / build | 0 errors (54 pre-existing warnings) / 25/25 / 0 / 9 suites, 82 tests / jest 82 + e2e 72 = 154 OK / OK, 9/9 static pages |
| `requirements.ready-ids` DSGN-05 | ready [], blocked [DSGN-05] (07-20 also declares it) |

## Self-Check: PASSED
- `0951de8` and `d114b42` are ancestors of HEAD; `git rev-list --count ef1d2b3..HEAD` = 2 from the plan ledger.
- No files were created; the 18 modified files are exactly the plan's `files_modified` list.
- Task 1 and Task 2 static acceptance criteria re-run at close-out and pass; lint, type-check, Jest and build results come from Tasks 1-2 and CI Unit/E2E pass on `d114b42`. All three Task 3 acceptance commands pass against the explicit SHAs.
- Plan-level verification: zero `dark:` in the scan set; CI visual green with no PNG changes.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
