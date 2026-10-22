---
phase: 07-foundation-guardrails
plan: 13
subsystem: ui
tags: [icons, phosphor, phosphor-icons-react, dist-ssr, eslint, no-restricted-imports, emoji-sweep, aria-hidden, aria-pressed, roadmap, visual-regression, re-baseline, dsgn-10]

requires:
  - phase: 07-12
    provides: "The 10px-gutter baselines this re-baseline diffs against, and the @chromium-only / no test.skip rule"
  - phase: 07-11
    provides: "whitespace-nowrap on the RoadmapTimeline badge spans (kept), and the 0.01 visual threshold the re-baseline ran under"
  - phase: 07-05
    provides: "The no-restricted-imports block in eslint.config.mjs that the Phosphor entries extend"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml"
provides:
  - "Dependency @phosphor-icons/react 2.1.10 (exact pin, MIT, no dependencies, no install scripts)"
  - "ESLint no-restricted-imports bans the @phosphor-icons/react root and @phosphor-icons/react/dist/csr*; only dist/ssr is allowed"
  - "Every live emoji icon in app/page.tsx, FeatureShowcase, ProjectHighlights, RoadmapFilters, RoadmapProgress, RoadmapTimeline and PhotoCarousel3D replaced by a 20px aria-hidden Phosphor icon beside its visible label (no weight prop)"
  - "Icon maps of component references with fallbacks: Circle (FeatureShowcase), ChartBar (ProjectHighlights)"
  - "RoadmapFilters buttons carry type=button and aria-pressed; priority and status keep visible text labels"
  - "RoadmapFilters.test and RoadmapTimeline.test rewritten: labels, one svg[aria-hidden] per option, aria-pressed state instead of colour classes (Jest count unchanged at 82)"
  - "36 of 72 visual baselines re-baselined in the 7e commit (home 18, clix-cli 6, clix-website 6, roadmap 6)"
affects: [07-14, 07-20, 07-22, 07-25, phase-09, phase-10, phase-11, phase-12]

actuals:
  tokens: 8069    # chars/4 over the text diff 40ebf7a..82d0cd0 excluding the PNGs (32274 chars across 12 files); the 36 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count 40ebf7a..HEAD = 1 (82d0cd0), before the docs commits
plan_head_before: 40ebf7a9b09f95837d15b78261f3e6552f7024ed
plan_head_after: 82d0cd008d8ee85dbf634faa7062b182905c8bac

tech-stack:
  added:
    - "@phosphor-icons/react 2.1.10"
  patterns:
    - "Icons import only from @phosphor-icons/react/dist/ssr (server-safe, resolves in Jest CJS without transformIgnorePatterns); render at size={20} with aria-hidden=\"true\" next to a visible text label, colour from currentColor, no weight prop"
    - "Icon maps store component references, not strings, and always have a fallback icon for unmapped keys"
    - "Filter toggles expose state with aria-pressed; tests assert aria-pressed rather than colour classes"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - eslint.config.mjs
    - app/page.tsx
    - components/FeatureShowcase.tsx
    - components/ProjectHighlights.tsx
    - components/RoadmapFilters.tsx
    - components/RoadmapProgress.tsx
    - components/RoadmapTimeline.tsx
    - components/PhotoCarousel3D.tsx
    - components/__tests__/RoadmapFilters.test.tsx
    - components/__tests__/RoadmapTimeline.test.tsx
    - e2e/visual/routes.spec.ts-snapshots/** (36 PNGs in home, clix-cli, clix-website, roadmap)

key-decisions:
  - "Phosphor imports are enforced by ESLint: no-restricted-imports bans the @phosphor-icons/react root (message 'Import icons from @phosphor-icons/react/dist/ssr (DSGN-10)') and the pattern @phosphor-icons/react/dist/csr*; probes: root exit 1, dist/csr/X exit 1, dist/ssr exit 0"
  - "Tim's option A: the 375px roadmap release pill overflow is accepted. 20px icons make the timeline badges 144.5x32 instead of 140x28, and the Target Release pill now crosses the card's right border by up to about 7px in the CI 375px render (Medium Priority cards and at least one completed card, v2.4.0). The locked 20px icon size stays; Phase 11's route-log roadmap redesign fixes the card header"
  - "In 2.1.10 the locked bare icon names (Camera, Path, ...) are @deprecated aliases of the *Icon names (same component). No change now; a future deprecation lint would flag them, and a later plan can rename to *Icon"
  - "DSGN-10 stays Pending: requirements.ready-ids reports it blocked, because 07-25 also declares it and has no SUMMARY yet (07-25 turns on the emoji guard and removes the lib/email.ts sparkle)"

patterns-established:
  - "Emoji scan for swept files: \\p{Extended_Pictographic} plus U+2713/2714/2717/2718, minus the typographic allowlist (copyright, registered, trademark)"

# Copied verbatim from the PLAN's `requirements`. DSGN-10 is NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports it blocked (07-25 also declares it and has no SUMMARY yet).
requirements-completed: [DSGN-10]

coverage:
  - id: D1
    description: "@phosphor-icons/react 2.1.10 is installed with an exact pin, and ESLint allows only the dist/ssr entry"
    requirement: DSGN-10
    verification:
      - kind: other
        ref: "grep package.json '\"@phosphor-icons/react\": \"2.1.10\"' (line 50); eslint --stdin probes: root import exit 1, dist/csr/X exit 1, dist/ssr exit 0 (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No emoji icons remain in the 7 swept components or the 2 rewritten tests; each swept item is a 20px aria-hidden Phosphor icon with no weight prop"
    requirement: DSGN-10
    verification:
      - kind: other
        ref: "plan <verify> emoji scan over 9 files -> 'no emoji icons', exit 0; grep -c 'weight=' FeatureShowcase + ProjectHighlights = 0; grep -rl '@phosphor-icons/react/dist/ssr' components = 5 (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unmapped feature and highlight keys render a fallback icon (Circle, ChartBar), never an emoji or an empty box"
    requirement: DSGN-10
    verification:
      - kind: manual_procedural
        ref: "Orchestrator review of baseline run 39868987405: unmapped features render the Circle fallback"
        status: pass
    human_judgment: true
    rationale: "No unit test asserts the fallback path; it was confirmed visually in the re-baseline review"
  - id: D4
    description: "RoadmapFilters and RoadmapTimeline tests are rewritten (labels, one aria-hidden svg per option, aria-pressed state), never deleted or skipped, and the test count does not drop"
    requirement: DSGN-10
    verification:
      - kind: unit
        ref: "components/__tests__/RoadmapFilters.test.tsx (aria-pressed 6, aria-hidden 1, bg-cyan-600 0 at close-out); Jest 9 suites / 82 tests; guard:tests jest 82 + e2e 72 = 154 (Task 1); CI Unit Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39871752110/job/120147579443"
        status: pass
    human_judgment: false
  - id: D5
    description: "The 7e re-baseline changes only the allowed routes, and no filter, stat or feature row wraps or clips at 375/768/1440"
    requirement: DSGN-10
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 82d0cd008d8ee85dbf634faa7062b182905c8bac --allow home --allow photos --allow clix-cli --allow clix-website --allow roadmap --some -> 'snapshot-commit: OK (36 changed)', exit 0 (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha 82d0cd008d8ee85dbf634faa7062b182905c8bac --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39871752110/job/120147579043, exit 0 (close-out re-run)"
        status: pass
    human_judgment: true
    rationale: "Wrap and clip are a visual judgement (E11 backstop). The orchestrator reviewed the rows and Tim reviewed and amended the 36 PNGs; the 375px release pill overflow is a known, accepted exception (Tim's option A)"

duration: 44 min (2026-10-22T22:50:48Z to 23:35:27Z), including 2 CI runs, 1 baseline run, the pill decision and Tim's review and amend
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 13: Phosphor dist/ssr icons replace every live emoji icon, enforced by ESLint, with 36 baselines re-baselined (7e)

**Commit `82d0cd0` installs `@phosphor-icons/react` 2.1.10 (exact pin) and bans the package root and the `dist/csr` build in ESLint, so icons can only come from `dist/ssr`. Every live emoji icon is swept: the home stats, FeatureShowcase, ProjectHighlights, the three Roadmap components and PhotoCarousel3D. Each is now a 20px `aria-hidden` Phosphor icon beside its existing label, with `Circle` and `ChartBar` as fallbacks. The two Roadmap tests are rewritten to assert labels, one hidden svg per option and `aria-pressed`, and the test count stays at 82. 36 baselines changed (home, clix-cli, clix-website, roadmap); Tim reviewed them and amended them into the commit. CI run 39871752110 passes every job. One accepted exception: at 375px the roadmap release pill now crosses the card border by up to about 7px (Tim's option A, deferred to Phase 11).**

## Performance

- **Duration:** 44 min wall clock, most of it CI (2 runs), the baseline run, the pill decision and Tim's review.
- **Started:** 2026-10-22T22:50:48Z
- **Completed:** 2026-10-22T23:35:27Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 48: 12 source, config and test files, and 36 baseline PNGs

## Accomplishments
- **One icon family (DSGN-10, live UI).** `npm install --save-exact @phosphor-icons/react@2.1.10` added 1 package: MIT, no dependencies, no install scripts, 14 lockfile lines. The 14 `npm audit` findings are all in packages that were already installed (babel, eslint-config-next, braces, micromatch, ws, …), none from Phosphor.
- **Import path enforced.** `eslint.config.mjs` extends the 07-05 `no-restricted-imports` block. It bans the path `@phosphor-icons/react` with the message "Import icons from @phosphor-icons/react/dist/ssr (DSGN-10)", and the pattern `@phosphor-icons/react/dist/csr*`.
- **Sweep, per the UI-SPEC mapping:**

  | File | Icons |
  |------|-------|
  | `app/page.tsx` stats | Camera, Code, CheckCircle, Path |
  | `FeatureShowcase` | 18 component references in the feature map; fallback `Circle` |
  | `ProjectHighlights` | Gauge, CheckCircle, ShieldCheck, ListChecks, CreditCard, LockKey, Wrench; fallback `ChartBar` |
  | Roadmap areas | Globe, Mountains, TerminalWindow, ShoppingCart, Package |
  | Roadmap status | ChartBar, CheckCircle, CircleHalf, CircleDashed |
  | Roadmap priority | CaretDoubleUp (high), Equals (medium), CaretDown (low); the visible "High Priority" etc. labels stay, so priority never relies on colour |
  | `PhotoCarousel3D` | the ferris-wheel emoji is removed and the text kept |

  Every icon is 20px and `aria-hidden`, with no `weight` prop and colour from `currentColor`. The 07-11 `whitespace-nowrap` on the timeline badges is kept.
- **Filter semantics.** The RoadmapFilters buttons gain `type="button"` and `aria-pressed` (true for the active filter).
- **Tests rewritten, never deleted or skipped.** `RoadmapFilters.test` asserts each label, exactly one `svg[aria-hidden="true"]` per option, and `aria-pressed` state in place of the `bg-cyan-600` / `bg-blue-600` class checks. `RoadmapTimeline.test` asserts labels plus one hidden svg instead of emoji text. Jest: 9 suites / 82 tests, the same as before.
- **Re-baseline (7e).** Baseline run 39868987405 (`update_mode=changed`) changed 36 of 72 shots: home 18 (6 reduced plus 12 scroll), clix-cli 6, clix-website 6 and roadmap 6. All 36 are pixel-identical to CI's actuals. Photos did not change, because the carousel is not in the shots; the plan allowed photos but did not require a change there. Page heights:

  | Route | 1440 | 375 | 768 |
  |-------|------|-----|-----|
  | home | 3534 → 3514 | 5685 → 5645 | 3949 → 3909 |
  | roadmap | 4771 → 4831 | 10187 → 10411 | 6195 → 6255 |

  The home stat cards are about 20px shorter, because 20px icons replace 36px emoji. The roadmap is taller because the badges grew from 28px to 32px high.

## Task Commits

1. **Task 1 (tracer): Phosphor dist/ssr icons replace every live emoji icon, tests rewritten in the same commit.** The Task 1 executor committed it as `74525e0`, with the planned body `Re-baseline: emoji -> Phosphor icons (7e); expected changes: home/*, photos/*, clix-cli/*, clix-website/*, roadmap/*.` The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Re-baseline the icon swap and confirm no wrapped or clipped rows** (checkpoint, blocking-human, resolved "pushed"). `74525e0` went to `ci/07-13` (CI 39868988325: Unit PASS, Visual failing on 36 shots as expected). Tim amended it with the 36 reviewed PNGs (`--no-edit`) and force-pushed with lease, giving **`82d0cd0`**. Tasks 1 and 2 share that commit.

`74525e0` was rewritten and is not in branch history. `git rev-list --count 40ebf7a..82d0cd0` = 1.

**Plan metadata:** the docs commits that follow this SUMMARY.

## Files Created/Modified
- `package.json`, `package-lock.json`: `@phosphor-icons/react` 2.1.10, exact pin.
- `eslint.config.mjs`: Phosphor root path and `dist/csr*` pattern added to `no-restricted-imports`.
- `app/page.tsx`: stat icons (Camera, Code, CheckCircle, Path); the emoji-only `text-4xl` class is removed.
- `components/FeatureShowcase.tsx`: feature map of component references with the `Circle` fallback.
- `components/ProjectHighlights.tsx`: highlight-key icons with the `ChartBar` fallback; `text-white` moved onto the svg.
- `components/RoadmapFilters.tsx`: area, status and priority icons; option arrays moved to module scope; `type="button"`, `aria-pressed`; inline-flex `gap-2` instead of the `mr-2` span (the same 8px).
- `components/RoadmapProgress.tsx`: status icons.
- `components/RoadmapTimeline.tsx`: badge icons; the `" "` text node is dropped (`gap-1` spaces them); `whitespace-nowrap` kept.
- `components/PhotoCarousel3D.tsx`: ferris-wheel emoji removed, text kept.
- `components/__tests__/RoadmapFilters.test.tsx`, `components/__tests__/RoadmapTimeline.test.tsx`: rewritten assertions (labels, hidden svg, `aria-pressed`).
- `e2e/visual/routes.spec.ts-snapshots/{home,clix-cli,clix-website,roadmap}/*.png`: 36 PNGs re-baselined (none added or deleted).

## Decisions Made
- **ESLint enforces the dist/ssr entry.** Probes: the root import exits 1, `dist/csr/X` exits 1, `dist/ssr` exits 0.
- **Tim's option A: accept the 375px release-pill overflow** (see deviation 1).
- **Deprecated bare names (note for a future lint).** In 2.1.10 the locked bare names (`Camera`, `Path`, …) are `@deprecated` aliases of the `*Icon` exports. They are the same component, so nothing changes now. A future deprecation lint would flag them; renaming to `*Icon` is a mechanical follow-up.
- **DSGN-10 stays Pending.** `requirements.ready-ids` returns `ready: [], blocked: [DSGN-10]`, because 07-25 also declares DSGN-10 and has no SUMMARY yet. 07-25 turns on the emoji guard rule and removes the `lib/email.ts` sparkle. The v1 Footer heart stops rendering when SiteFooter replaces it in 07-22. `requirements-completed` above copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.
- **ui-ux-pro-max** was loaded before the Task 1 edits. The locked spec won every conflict, and none of these observations was acted on:
  - The skill's sample uses the root import and `weight`; the spec requires `dist/ssr` and no weight.
  - The locked 20px exceeds the spec's own 16px-icon / 14px-text pairing on the 12px badges and 14px filters.
  - The timeline dot's CheckCircle ring touches the dot's white border (decorative, aria-hidden).
  - The filter buttons are about 36px tall. That meets WCAG 2.2's 24px minimum but is under the 44px recommendation, as before.
  - The home stat cards are about 20px shorter (20px icons replace 36px emoji).

## Deviations from Plan

### Accepted visual exception (Tim's decision)

**1. [Rule 4 - Decision, Tim's option A] The roadmap release pill crosses the card border at 375px**
- **Found during:** Task 2 (re-baseline review)
- **Issue:** 20px icons make the timeline badges 144.5×32 instead of 140×28 (+4.5px wide, +4px tall). In the CI 375px render the "Target Release" pill and its label now cross the card's right border by up to about 7px on several cards. That includes the Medium Priority cards and at least one completed card (v2.4.0). The 07-12 baseline already showed the pill touching or slightly crossing the border, because CI screenshots reserve a 10px gutter (07-12, A2 false); 7e adds about 5px. Measured locally without a gutter, like a real 375px phone, the pill crosses the inner border edge on 5 of 6 Medium cards by 0.8–5.1px.
- **Options:**

  | Option | Change | Outcome |
  |--------|--------|---------|
  | A | Accept | Keeps the locked 20px |
  | B | 16px icons in the badges only | Not chosen |
  | C | Change the card layout | Not chosen |

- **Resolution:** Tim chose A. The overflow is logged as a STATE concern for Phase 11's route-log roadmap: fix the card header so the release block cannot overflow at narrow widths.
- **Committed in:** `82d0cd0` (the baselines show the accepted state)

### Small non-visual extras (Task 1, within the swept files)

**2. [Rule 2 - Missing critical] Filter button semantics and cleanup**
- **Found during:** Task 1
- **Changes:**
  - `type="button"` and `aria-pressed` on the filters (the plan asks for `aria-pressed` if it is missing);
  - the option arrays moved to module scope;
  - inline-flex `gap-2` replaces the `mr-2` span (the same 8px);
  - the timeline badges drop the `" "` text node (`gap-1` spaces them);
  - `text-white` moved onto the svg in ProjectHighlights;
  - the emoji-only `text-2xl` / `text-4xl` classes removed.
- **Verification:** Jest 82, lint 0 errors (54 pre-existing warnings), type-check 0, build OK with contrast 24/24. Any visual effect is inside the reviewed 36-shot re-baseline.
- **Committed in:** `82d0cd0`

---

**Total deviations:** 2: one accepted visual exception (Tim's option A) and one set of small semantic and cleanup extras.
**Impact on plan:** Every must_have truth holds, except that the 375px release pill now crosses the card border on the roadmap. That is Tim's accepted exception and is tracked for Phase 11. No filter, stat or feature row wraps or clips (orchestrator review at 375/768/1440).

## Issues Encountered
- CI 39868988325 on `74525e0`: Unit PASS; Visual failed on 36 shots (expected before the re-baseline).
- CI 39871752110 on `82d0cd0`: every job passed.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-19 (Phosphor tampering):** mitigated as planned. Exact pin and lockfile integrity. The orchestrator re-checked legitimacy just before the install: `latest` = 2.1.10, published 2025-05-22 and unchanged since; repo phosphor-icons/react; maintainer rektdeckard; no install scripts. `dist/ssr` adds no network origins, so the CSP is unchanged.
- **T-07-SC (npm installs):** the package-legitimacy gate passed before the install; 1 package added, with no dependencies.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-14.** Icons are one family, the import path is lint-enforced, and the roadmap tests assert semantics instead of colour.
- **For later plans:**
  - 07-25 turns on the emoji guard rule and removes the `lib/email.ts` sparkle; DSGN-10 can flip to Complete then.
  - Phase 11 (route-log roadmap): fix the card header so the release block cannot overflow at 375px.
  - Any new icon imports from `@phosphor-icons/react/dist/ssr` at 20px with `aria-hidden` beside a visible label. Prefer the `*Icon` export names in new code.
- **Still open:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. The required status checks, the hero badge contrast, the snow-50 hover and the 37 utility-styled headings concerns are unchanged.
- **Pushing:** `82d0cd0` is on `origin/ci/07-13` (force-pushed with lease by Tim). The docs commits stay local.

## Verification (close-out, 2026-10-22T23:35Z)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha 82d0cd008d8ee85dbf634faa7062b182905c8bac --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39871752110/job/120147579043`, exit 0 |
| `check-visual-run.mjs --sha 82d0cd00… --job "E2E Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39871752110/job/120147579339`, exit 0 |
| `check-visual-run.mjs --sha 82d0cd00… --job "Unit Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39871752110/job/120147579443`, exit 0 |
| `check-snapshot-commit.mjs --sha 82d0cd00… --allow home --allow photos --allow clix-cli --allow clix-website --allow roadmap --some` | `snapshot-commit: OK (36 changed)`, exit 0 |
| PNGs in `82d0cd0` | 36 modified, 0 added or deleted |
| `package.json` | `"@phosphor-icons/react": "2.1.10"` |
| ESLint probes (stdin) | root exit 1, `dist/csr/X` exit 1, `dist/ssr` exit 0 |
| `grep -rl "@phosphor-icons/react/dist/ssr" components` | 5 (plus `app/page.tsx`) |
| RoadmapFilters.test | `aria-pressed` 6, `aria-hidden` 1, `bg-cyan-600` 0 |
| `grep -c "weight="` FeatureShowcase + ProjectHighlights | 0 + 0 |
| Emoji scan (plan `<verify>`, 9 files) | `no emoji icons`, exit 0 |
| Task 1: Jest / guard:tests / lint / type-check / build | 9 suites, 82 tests / jest 82 + e2e 72 = 154 OK / 0 errors (54 pre-existing warnings) / 0 / OK, contrast 24/24 |
| `public/service-worker.js` | clean (restored after the build) |
| `requirements.ready-ids` DSGN-10 | ready [], blocked [DSGN-10] (07-25 also declares it) |

## Self-Check: PASSED
- `82d0cd0` is HEAD and an ancestor of itself. `git rev-list --count 40ebf7a..HEAD` = 1, measured from the plan ledger.
- No files were created. The 12 modified source, config and test files contain the stated changes, and the 36 PNGs are in `82d0cd0`.
- Every Task 1 acceptance criterion that can be checked statically was re-run at close-out and passes. Jest, lint, type-check and build results come from Task 1, and CI Unit Tests passes on `82d0cd0`. Both Task 2 acceptance commands, plus the E2E and Unit job checks, pass against the explicit SHA `82d0cd0`.
- Plan-level verification: no emoji in the swept files, Jest green with the count intact, lint, type-check and build green, and CI Visual green with only allowed routes re-baselined.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
