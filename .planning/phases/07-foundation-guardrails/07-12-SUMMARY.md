---
phase: 07-foundation-guardrails
plan: 12
subsystem: ui
tags: [scrollbar, scrollbar-gutter, scrollbar-color, color-scheme, tailwind-v4, utility, playwright, hide-scrollbars, layout-shift, visual-regression, re-baseline, dsgn-09]

requires:
  - phase: 07-11
    provides: "e2e/design-system.spec.ts (the file the Scrollbar describe joins) and the 0.01 visual threshold the re-baseline ran under"
  - phase: 07-09
    provides: "L1 primitives --night-500 / --night-950 / --mist-300 and the reduced-motion block (view-transition animation none, html scroll-behavior auto)"
  - phase: 07-03
    provides: "check-visual-run.mjs, check-snapshot-commit.mjs, visual-baselines.yml"
provides:
  - "Global scrollbar hiding removed; html { color-scheme: dark; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: var(--night-500) var(--night-950) } (thumb 4.85:1 on the track)"
  - "@supports not (scrollbar-color: auto) ::-webkit-scrollbar fallback (8px, night-950 track, night-500 thumb, mist-300 hover, 4px radius)"
  - "@utility scrollbar-none for inner scrollers (no Phase 7 element uses it yet)"
  - "e2e/design-system.spec.ts describe Scrollbar: computed gutter/width/scheme on /, and G3 `scroll lock keeps the header box @chromium-only` with real scrollbars (own Chromium without --hide-scrollbars)"
  - "All 72 visual baselines re-baselined for the 10px gutter in the 7d commit"
affects: [07-13, 07-20, 07-21, 07-22, 07-23, phase-09, phase-10, phase-11, phase-12]

actuals:
  tokens: 1343    # chars/4 over the text diff c3a63e8..f14d82c (5373 chars: app/globals.css, e2e/design-system.spec.ts); the 72 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count c3a63e8..f14d82c (f14d82c), before the docs commit
plan_head_before: c3a63e8bbf4384ea8f244123bff1981df9ca816b
plan_head_after: f14d82cf199e536f422a7c76a721222b434dde3a

tech-stack:
  added: []
  patterns:
    - "Scrollbar tests assert computed styles, because headless Chromium launches with --hide-scrollbars; a box-unchanged check must launch its own browser with ignoreDefaultArgs: ['--hide-scrollbars'] and guard against a vacuous pass (innerWidth - clientWidth > 0)"
    - "Read a bounding box only after two consecutive reads agree; entrance animations (v1 Header slides from y -100) otherwise look like a layout shift"
    - "Browser-scoped tests use the @chromium-only title tag, never test.skip (the test-count guard rejects any .skip()"

key-files:
  created: []
  modified:
    - app/globals.css
    - e2e/design-system.spec.ts
    - e2e/visual/routes.spec.ts-snapshots/** (72 PNGs across all 9 route folders)

key-decisions:
  - "Assumption A2 is false: scrollbar-gutter: stable reserves a 10px gutter even under --hide-scrollbars, so the screenshot layout is 10px narrower and centred content moves 5px left. All 72 baselines were re-baselined in the 7d commit (the plan accepts a width change as the 7d reason). At 375px the baselines are 10px narrower than real phones, whose overlay scrollbars reserve no gutter; that is a test-environment quirk, not a site bug"
  - "Assumption A3 holds: body overflow:hidden keeps the gutter on html (header box {0,0,1430,82} before and after opening the photo modal; negative control with scrollbar-gutter: auto went 1430 -> 1440). components/ImageDetailModal.tsx and components/GlassmorphismNav.tsx are untouched"
  - "Playwright's headless Firefox forces the root's scrollbar-width to none (computed scrollbarGutter is still stable, so our html rule applies); the scrollbar-width assertion runs only when browserName !== 'firefox', the gutter and color-scheme assertions run everywhere"
  - "G3 must never use test.skip: scripts/guards/test-count.mjs rejects any .skip( ('tests are rewritten, never skipped'); the @chromium-only tag keeps it out of the Firefox project, and the WebKit project running it is harmless because it launches its own Chromium"
  - "DSGN-09 marked Complete: requirements.ready-ids reports it ready, because 07-12 is the only plan that declares it"

patterns-established:
  - "Real-scrollbar layout checks: chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] }) with the project baseURL, closed in finally (test.use({ launchOptions }) inside a describe forces a new worker and Playwright refuses it)"

# Copied verbatim from the PLAN's `requirements`. DSGN-09 IS flipped to Complete in
# REQUIREMENTS.md: requirements.ready-ids reports it ready (07-12 is its only declaring plan).
requirements-completed: [DSGN-09]

coverage:
  - id: D1
    description: "The global scrollbar-hiding rules are gone; html computes scrollbar-gutter stable, scrollbar-width thin and color-scheme dark"
    requirement: DSGN-09
    verification:
      - kind: other
        ref: "grep -cE '^\\*::-webkit-scrollbar|-ms-overflow-style' app/globals.css = 0; grep -cF 'scrollbar-gutter: stable' / 'scrollbar-width: thin' / 'color-scheme: dark' = 1 each (close-out re-run)"
        status: pass
      - kind: e2e
        ref: "e2e/design-system.spec.ts#html carries the stable gutter, thin width and dark scheme (CI E2E Tests run 39862935420; width not asserted in Firefox, see deviation 4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Thumb --night-500 on a --night-950 track (4.85:1), with a ::-webkit-scrollbar fallback only where scrollbar-color is unsupported"
    requirement: DSGN-09
    verification:
      - kind: other
        ref: "grep -cF app/globals.css 'scrollbar-color: var(--night-500) var(--night-950)' = 1 and '@supports not (scrollbar-color: auto)' = 1 (close-out re-run); 4.85:1 against the 3:1 non-text requirement (Task 1, ui-ux-pro-max review)"
        status: pass
    human_judgment: false
  - id: D3
    description: "An inner scroller can opt out with the scrollbar-none utility"
    requirement: DSGN-09
    verification:
      - kind: other
        ref: "grep -cF app/globals.css '@utility scrollbar-none' = 1 (close-out re-run); no Phase 7 element uses it yet"
        status: pass
    human_judgment: false
  - id: D4
    description: "Under prefers-reduced-motion the view-transition pseudo-elements do not animate and html scroll-behavior is auto"
    verification:
      - kind: other
        ref: "app/globals.css @media (prefers-reduced-motion: reduce) (line 476): ::view-transition-group/old/new(*) (lines 508-510) and scroll-behavior: auto (line 514), present from 07-09 and unchanged (close-out re-run)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Opening the scroll-locking photo modal leaves the header bounding box unchanged with real scrollbars (G3)"
    requirement: DSGN-09
    verification:
      - kind: e2e
        ref: "e2e/design-system.spec.ts#scroll lock keeps the header box @chromium-only (local Chromium: gutter 10px, box {0,0,1430,82} before and after; CI E2E Tests PASS https://github.com/tlex-web/portfolio-app/actions/runs/39862935420/job/120117913142)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The scrollbar commit is its own commit and every changed baseline is re-baselined in it with the reason stated"
    requirement: DSGN-09
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha f14d82cf199e536f422a7c76a721222b434dde3a --some --allow clix-cli --allow clix-website --allow contact --allow home --allow not-found --allow offline --allow photos --allow projects --allow roadmap -> 'snapshot-commit: OK (72 changed)', exit 0 (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha f14d82cf199e536f422a7c76a721222b434dde3a --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/39862935420/job/120117913080, exit 0 (close-out re-run)"
        status: pass
    human_judgment: true
    rationale: "Whether the 10px-narrower re-baselined pages read as intended is a visual judgement. Tim reviewed the artifact and amended the 72 PNGs into the commit (checkpoint resolved 'pushed')"

duration: 1h 0m (2026-10-22T21:47:20Z to 22:47Z), including 3 CI runs, 1 baseline run, the two spec fixes and Tim's review and amend
completed: 2026-10-22
status: complete
---

# Phase 7 Plan 12: Thin visible scrollbar with a stable gutter, G3 header-box check with real scrollbars, 72 baselines re-baselined (7d)

**Commit `f14d82c` removes the global scrollbar hiding. `html` now carries `color-scheme: dark`, `scrollbar-gutter: stable`, `scrollbar-width: thin` and a `--night-500` on `--night-950` thumb (4.85:1). There is a `::-webkit-scrollbar` fallback only where `scrollbar-color` is unsupported, and an `@utility scrollbar-none` for inner scrollers. A new `Scrollbar` describe in `e2e/design-system.spec.ts` asserts the computed styles. Its G3 test launches Chromium without `--hide-scrollbars`, opens the /photos modal and proves the header box does not move. The gutter is reserved even in headless screenshots (Assumption A2 is false), so all 72 baselines moved 10px narrower; Tim reviewed and amended them into the same commit. CI run 39862935420 passes every job.**

## Performance

- **Duration:** 1h 0m wall clock, most of it CI (3 runs) and the baseline run plus Tim's review.
- **Started:** 2026-10-22T21:47:20Z
- **Completed:** 2026-10-22T22:47:12Z (close-out verification)
- **Tasks:** 2/2
- **Files modified:** 74: 2 source/test files and 72 baseline PNGs

## Accomplishments
- **Visible thin scrollbar (DSGN-09).** Both global hide rules (`*::-webkit-scrollbar { display: none }` and `* { scrollbar-width: none; -ms-overflow-style: none }`) are gone. `html { color-scheme: dark; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: var(--night-500) var(--night-950); }` uses L1 primitives, because L1 is always emitted.
- **WebKit fallback.** `@supports not (scrollbar-color: auto)` sets an 8px `::-webkit-scrollbar` with a night-950 track, a night-500 thumb (4px radius) and a mist-300 hover.
- **Opt-out utility.** `@utility scrollbar-none` (scrollbar-width none plus a hidden `::-webkit-scrollbar`). No Phase 7 element uses it yet.
- **Reduced motion.** The 07-09 block (view-transition pseudo-elements `animation: none`, `html { scroll-behavior: auto }`) is present and unchanged.
- **Scrollbar spec.** `e2e/design-system.spec.ts` describe `Scrollbar`:
  1. On `/`, `document.documentElement` computes `scrollbarGutter: stable`, `scrollbarWidth: thin` (not asserted in Firefox) and `colorScheme: dark`.
  2. G3, `scroll lock keeps the header box @chromium-only`: it launches its own Chromium without `--hide-scrollbars` and opens a 1440x900 /photos page. It asserts the real gutter is > 0, waits for a settled header box, opens the first photo modal and asserts x, y and width are unchanged. Locally the gutter was 10px and the box was {0,0,1430,82} before and after.
  
  The spec passes 7/7 locally on Chromium and in CI.
- **No scroll-lock change needed (Assumption A3 holds).** `body` `overflow: hidden` keeps the gutter on `html`. A throwaway negative control with `scrollbar-gutter: auto` made the header width go 1430 → 1440, so G3 really detects the shift. `components/ImageDetailModal.tsx` and `components/GlassmorphismNav.tsx` are untouched.
- **Gutter re-baseline.** All 72 shots changed. The layout is 10px narrower and centred content moves exactly 5px left (a horizontal-shift fit with error 0.00 at dx = −5 on the 404 and home bands). Page heights at 375/768 reflow:

  | Shot | Before | After |
  |------|--------|-------|
  | clix-cli 375 | 9081 | 9217 |
  | clix-website 375 | 8237 | 8341 |
  | home 375 | 5655 | 5685 |
  | photos 375 | 2768 | 2762 |
  | photos 768 | 1825 | 1818 |

  Contact's native controls show no visible change beyond the shift, because they have explicit styles.

## Task Commits

1. **Task 1 (tracer): Thin visible scrollbar with stable gutter, proven by computed styles and the G3 box check.** The Task 1 executor committed it as `df94f74` (`app/globals.css`, `e2e/design-system.spec.ts`). The orchestrator amended it to `6e86f59` to fold in two spec fixes (deviations 3 and 4); the app code is identical to `df94f74`. The tracer gate re-ran `<verify>` and it passed.
2. **Task 2: Re-baseline and confirm CI green** (checkpoint, blocking-human). Tim amended `6e86f59` with the 72 reviewed PNGs (`--no-edit`) and force-pushed with lease, giving **`f14d82c`**. Tasks 1 and 2 share that commit. Its body records the actual change (every route, 10px gutter) next to the planned re-baseline line.

`df94f74` and `6e86f59` were rewritten and are not in branch history. `git rev-list --count c3a63e8..f14d82c` = 1.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `app/globals.css`: global hide rules removed; the html scrollbar rule, the `@supports not (scrollbar-color: auto)` webkit fallback and `@utility scrollbar-none` added.
- `e2e/design-system.spec.ts`: describe `Scrollbar` with the computed-style test and G3 (`@chromium-only`, own Chromium without `--hide-scrollbars`).
- `e2e/visual/routes.spec.ts-snapshots/{clix-cli,clix-website,contact,home,not-found,offline,photos,projects,roadmap}/*.png`: all 72 PNGs re-baselined (home 24, every other route 6; none added or removed).

## Decisions Made
- **Assumption A2 does not hold, and the plan accepted that outcome.** `--hide-scrollbars` hides the scrollbar but `scrollbar-gutter: stable` still reserves its 10px. The plan's Task 2 text says a layout width change "is acceptable as the stated 7d reason", so every route was re-baselined in the 7d commit. **For later phases:** at 375px the visual baselines are 10px narrower than real phones, because overlay scrollbars reserve no gutter. Mobile layouts judged from the baselines have 10px less room than a real device, so anything that fits there also fits on a phone.
- **Assumption A3 holds.** No scroll-lock move to `documentElement` was needed (see Accomplishments).
- **ui-ux-pro-max** was loaded before the Task 1 edits and raised no conflicts. Thumb contrast is 4.85:1 against the 3:1 non-text requirement. Its `content-jumping` guideline supports the stable gutter. Its recommended smooth `scroll-behavior` is acceptable only because the reduced-motion block resets it to `auto`.
- **Re-baseline review.** Baseline run 39860743391 (`ci/07-12`, `update_mode=changed`) changed 72/72 shots, and all 72 are pixel-identical to CI's actuals. `6e86f59` went to `ci/07-12-r2` (CI 39862585079: Unit PASS, E2E PASS, Visual failing before the PNGs). Its app code is identical to `df94f74`, so the baseline run stayed valid.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] G3 launches its own browser**
- **Found during:** Task 1
- **Issue:** The plan's `test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })` inside a describe is refused by Playwright ("forces a new worker"). A top-level `test.use` would have removed `--hide-scrollbars` for the whole file.
- **Fix:** G3 calls `chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })`, uses the project `baseURL` and closes the browser in `finally`. The spec still contains `ignoreDefaultArgs` and `--hide-scrollbars` (acceptance).
- **Files modified:** `e2e/design-system.spec.ts`
- **Verification:** design-system spec 7/7 on local Chromium; CI E2E 39862935420 PASS.
- **Committed in:** `f14d82c` (via `df94f74`)

**2. [Rule 1 - Bug] Settled-box wait, plus [Rule 2 - Missing critical] vacuous-pass guard**
- **Found during:** Task 1 (first G3 run)
- **Issue:** G3 failed on y (−100 vs −92.2). The v1 /photos `Header` slides in from y −100 over `DURATION.enter`, so the first read caught the entrance animation. This was a test timing bug, not a gutter shift.
- **Fix:** G3 reads the box only once two consecutive reads agree. It also first asserts `innerWidth − clientWidth > 0`, so the test cannot pass if scrollbars are hidden after all.
- **Files modified:** `e2e/design-system.spec.ts`
- **Verification:** G3 passes with a 10px gutter; the `scrollbar-gutter: auto` negative control fails it (1430 → 1440).
- **Committed in:** `f14d82c` (via `df94f74`)

**3. [Rule 1 - Bug] Test-count guard rejected `test.skip` (CI run 39860744640, Unit Tests failed)**
- **Found during:** Task 2 (first CI run)
- **Issue:** The Task 1 executor had added `test.skip(browserName !== 'chromium', …)` to G3. `scripts/guards/test-count.mjs` rejects any `.skip(` ("tests are rewritten, never skipped").
- **Fix:** The orchestrator removed the skip. The `@chromium-only` title tag already keeps G3 out of the Firefox project. Locally the WebKit project may also run it, which is harmless because G3 launches its own Chromium.
- **Files modified:** `e2e/design-system.spec.ts`
- **Verification:** the local guard passed (jest 82 + e2e 72 = 154, baseline 91); CI Unit Tests PASS on 39862585079 and 39862935420. `grep -cF 'test.skip(' e2e/design-system.spec.ts` = 0.
- **Committed in:** `f14d82c` (via `6e86f59`)

**4. [Rule 1 - Bug] Firefox computed scrollbar-width (CI run 39860744640, E2E failed)**
- **Found during:** Task 2 (first CI run)
- **Issue:** In Firefox the computed `scrollbarGutter` was `stable`, so the html rule does apply, but `scrollbarWidth` was `none`. Playwright's headless Firefox hides scrollbars by forcing the root's `scrollbar-width` to `none`.
- **Fix:** The width assertion runs only when `browserName !== 'firefox'`, with a comment explaining why. The gutter and color-scheme assertions run in every browser.
- **Files modified:** `e2e/design-system.spec.ts`
- **Verification:** Firefox isn't installed locally for Playwright 1.64, so this was diagnosed from CI (the gutter passed and only the width differed). CI 39862585079 on `6e86f59` then passed Unit and E2E, and so did 39862935420 on `f14d82c`.
- **Committed in:** `f14d82c` (via `6e86f59`)

**5. [Plan assumption - anticipated by the plan] Assumption A2 does not hold; all 72 baselines re-baselined**
- **Found during:** Task 2 (CI run 39860744640, Visual failed 72/72)
- **Issue:** The plan expected little or no visual change, because `--hide-scrollbars` was assumed to hide the gutter as well. It doesn't. `scrollbar-gutter: stable` reserves 10px in every screenshot.
- **Resolution:** The plan's Task 2 text accepts a layout width change as the 7d reason. Tim reviewed all 72 PNGs from baseline run 39860743391 and amended them into the 7d commit. The commit message records the actual change.
- **Verification:** `check-snapshot-commit --sha f14d82c --some --allow` × 9 slugs → `OK (72 changed)`; every committed blob matches the reviewed artifact. CI 39862935420 Visual PASS.
- **Committed in:** `f14d82c`

---

**Total deviations:** 5. Four are auto-fixes (1 Rule 3 blocking, 2 Rule 1 bugs, and 1 Rule 1 bug with a Rule 2 guard) and one is a plan-anticipated outcome (A2 false).
**Impact on plan:** Every must_have truth holds. All auto-fixes are confined to the spec file. The scope matches the plan: no scroll-lock file changed, and the re-baseline covers every route, as the plan allowed for a gutter width change.

## Issues Encountered
- CI 39860744640 on `df94f74`: Visual failed 72/72 (expected before the re-baseline). Unit failed on the test-count guard (deviation 3). E2E failed on the Firefox width assertion (deviation 4).
- CI 39862585079 on `6e86f59` (`ci/07-12-r2`): Unit PASS, E2E PASS, Visual failing until the PNGs were added.
- CI 39862935420 on `f14d82c`: every job passed.

## Known Stubs
None. `@utility scrollbar-none` has no consumer yet; that is by design (DSGN-09 provides the opt-out for future inner scrollers).

## Threat Flags
None new.
- **T-07-18 (layout shift on scroll lock):** mitigated as planned. G3 runs with real scrollbars and proves the header box is unchanged; no scroll-lock change was needed (A3 holds).
- **T-07-SC (npm installs):** not applicable. No packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim:
- confirm the Vercel build log shows Node 24.x and `npm ci` (this keeps GUARD-01 Pending);
- make Visual Regression, Lint and Type Check, and Unit Tests required status checks on `main`.

## Next Phase Readiness
- **Ready for 07-13.** The scrollbar is visible, the gutter is stable, and `scrollbar-none` is available for inner scrollers.
- **For later plans:**
  - Any new scroll-locking overlay (the Phase 10 lightbox, the 07-22 SiteNav menu) inherits the G3 rule. Keep locking `body`, or anything that leaves the gutter on `html`; extend G3 when the overlay lands.
  - Tests that need a single browser use the `@chromium-only` title tag, never `test.skip`.
  - Scrollbar assertions in Firefox must not check `scrollbarWidth` (headless forces `none`).
  - The 375px baselines are 10px narrower than real phones (test-environment quirk).
- **Still open:** `main` (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges the phase branch. The required status checks, the hero badge contrast, the snow-50 hover and the 37 utility-styled headings concerns are unchanged.
- **Pushing:** `f14d82c` is on `origin/ci/07-12-r2` (force-pushed with lease by Tim). The docs commit stays local.

## Verification (close-out, 2026-10-22T22:47Z)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha f14d82cf199e536f422a7c76a721222b434dde3a --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39862935420/job/120117913080`, exit 0 |
| `check-visual-run.mjs --sha f14d82cf… --job "E2E Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39862935420/job/120117913142`, exit 0 |
| `check-visual-run.mjs --sha f14d82cf… --job "Unit Tests" --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/39862935420/job/120117912967`, exit 0 |
| `check-snapshot-commit.mjs --sha f14d82cf… --some --allow` × 9 slugs | `snapshot-commit: OK (72 changed)`, exit 0 |
| globals.css acceptance (5 strings + `color-scheme: dark`) | 1 match each |
| Global-hide grep (`^\*::-webkit-scrollbar\|-ms-overflow-style`) | 0 |
| design-system.spec.ts | `ignoreDefaultArgs` 1, `scrollbarGutter` 2, `--hide-scrollbars` 3, `@chromium-only` 3, `test.skip(` 0 |
| Reduced-motion block | view-transition pseudo-elements and `scroll-behavior: auto` present (lines 476-514) |
| `components/` diff `c3a63e8..f14d82c` | 0 files (ImageDetailModal, GlassmorphismNav untouched) |
| PNGs in `f14d82c` | 72 modified (home 24, the other 8 routes 6 each), 0 added or deleted |
| Task 1: design-system spec / lint / type-check / jest | 7/7 Chromium / 0 errors (54 pre-existing warnings) / exit 0 / 9 suites, 82 tests |
| Test-count guard (local) | jest 82 + e2e 72 = 154 ≥ baseline 91 |
| `requirements.ready-ids` DSGN-09 | ready [DSGN-09], blocked [] |

## Self-Check: PASSED
- `f14d82c` is HEAD, an ancestor of itself. `git rev-list --count c3a63e8..f14d82c` = 1, measured from the plan ledger.
- No files were created. The 2 modified source files contain the stated changes, and the 72 PNGs are in `f14d82c`.
- Every Task 1 acceptance criterion was re-run at close-out and passes. Both Task 2 acceptance commands, plus the Unit Tests job check, pass against the explicit SHA `f14d82c`, and the per-slug snapshot check passes on it.
- Plan-level verification: the design-system spec is green including G3, the global hide rules are removed, and CI Visual and E2E are green after the reviewed re-baseline.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-22*
