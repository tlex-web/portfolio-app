---
phase: 07-foundation-guardrails
plan: 21
subsystem: ui
tags: [shell, site-chrome, site-nav, site-footer, skip-link, identity, disclosure-menu, a11y, aria-current, motion-safe, starting-style, jsdom, shell-01, shell-02, shell-03, build-step-9]

requires:
  - phase: 07-20
    provides: "Palette guard in lint (v1names rule over components/site/**, components/providers/**, data/site.ts; zero white/black allowance for new files) and the contrast check"
  - phase: 07-09
    provides: "Tokens v2 L2 semantic utilities, --duration-fast/--duration-panel and the geological/erosion/descent easings, MotionProvider"
  - phase: 07-11
    provides: "font-display (Schibsted Grotesk), text-heading token, 2px focus-visible ring"
provides:
  - "data/site.ts: typed identity source (Tim Lui; Developer & photographer; GitHub; Tim's email and LinkedIn; five nav destinations) `as const satisfies Site`"
  - "data/types.ts: NavItem and Site interfaces (email and links.linkedin required strings)"
  - "components/site/SkipLink.tsx, SiteNav.tsx (variant default|static, mobile disclosure menu), SiteFooter.tsx, SiteChrome.tsx (children, variant)"
  - "app/globals.css: --nav-h, --z-nav, --z-menu, --z-skip; html scroll-padding-top; v1 .sr-only/.not-sr-only copies removed"
  - "components/site/__tests__/SiteChrome.test.tsx (7) and SiteNav.test.tsx (8): 15 jsdom tests"
affects: [07-22, 07-23, 07-24, 07-25, 08, 09, 12]

actuals:
  tokens: 6810    # chars/4 over `git diff fbcd74a..77010e7` (9 files, 655+/22-)
  tasks: 3        # Task 1 checkpoint resolved by Tim's reply (no commit), Tasks 2 and 3 executed
  commits: 4      # measured: git rev-list --count fbcd74a..HEAD = 4 (1ae6ea8, bfb981b, 1676756, 77010e7), before the docs commits
plan_head_before: fbcd74abeedbfb7f95d99fe0fe92420a5c5fac2f
plan_head_after: 77010e730de6b429760bcd297cb5a9cfafbeecba

tech-stack:
  added: []
  patterns:
    - "Identity lives in one `as const satisfies Site` object; required string fields make a missing contact value a tsc error"
    - "Disclosure menu: listeners attached only while open; route-change close by adjusting state during render (no setState in an effect)"
    - "CSS-only enter/exit on a `hidden` panel: @starting-style (Tailwind `starting:`) for entry, `transition-discrete` + display in transition-property for exit, all under motion-safe:"
    - "Router-free static nav variant for global-error (plain anchors, no usePathname)"

key-files:
  created:
    - data/site.ts
    - components/site/SkipLink.tsx
    - components/site/SiteNav.tsx
    - components/site/SiteFooter.tsx
    - components/site/SiteChrome.tsx
    - components/site/__tests__/SiteChrome.test.tsx
    - components/site/__tests__/SiteNav.test.tsx
  modified:
    - data/types.ts
    - app/globals.css

key-decisions:
  - "Task 1 input came from Tim's own reply in this session ('approved - old2shatterhand@gmail.com - https://www.linkedin.com/in/luitim/'); written verbatim to data/site.ts (email old2shatterhand@gmail.com, linkedin https://www.linkedin.com/in/luitim/ with its trailing slash). Not derived from git config or account metadata (SHELL-03 prohibition satisfied)"
  - "Task 3 uses tdd.md's RED -> GREEN commit split (test(07-21) bfb981b, then feat(07-21) 1676756), because tdd.md's cycle commits RED separately; 07-20 used one commit only because its plan text said so"
  - "Static SiteNav header uses min-h-16 instead of h-16 so its always-visible wrapping row (6 links) grows the header instead of overflowing onto main at 375 px"
  - "Desktop <ul> precedes the Menu button and panel in DOM order: Tab from the button reaches the first menu link, and Tab past the last menu link leaves the header (closing the menu)"
  - "The 2px indicator bars use h-0.5 / w-0.5 (a stroke, like the focus geometry exception), not spacing"
  - "focusout with a null relatedTarget (window blur, tab switch) does not close the menu; only focus moving to a node outside the header does"
  - "The v1 hand-written .sr-only (clip: rect(0,0,0,0)) is removed from globals.css: Tailwind's focus:not-sr-only resets clip-path but not clip, so the focused skip link stayed invisible"

patterns-established:
  - "Shell components import nothing from motion/react; MotionProvider is mounted by SiteChrome's default variant only"
  - "Every close trigger of a disclosure has its own test, and each was mutation-checked (removing the trigger fails exactly its test)"

# Copied verbatim from the PLAN's `requirements`. None flipped in REQUIREMENTS.md:
# requirements.ready-ids 07-21-PLAN.md -> ready [], blocked [SHELL-01, SHELL-02, SHELL-03]
# (07-22 declares all three, 07-23 SHELL-01, 07-25 SHELL-03; none has a SUMMARY yet).
requirements-completed: [SHELL-01, SHELL-02, SHELL-03]

coverage:
  - id: D1
    description: "data/site.ts is the single typed identity source with Tim's real email and LinkedIn URL; removing either field fails type-check"
    requirement: SHELL-03
    verification:
      - kind: other
        ref: "identity-value node check from 07-21 Task 2 <verify> -> 'identity values OK'; npm run type-check exit 0; grep acceptance criteria (name, role, github, satisfies Site; email: string; linkedin: string; without ?) all PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "SiteChrome renders skip link first, one header with one Primary nav, one main#main-content tabIndex -1, one footer without a nav; footer links use the site values; current-page matching; static variant"
    requirement: SHELL-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteChrome.test.tsx (7/7 pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mobile disclosure menu: Menu button with aria-expanded/aria-controls, panel hidden when closed, closes on route change, Escape (focus return), second press, outside pointerdown, focus leaving the header and the 768px breakpoint"
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteNav.test.tsx (8/8 pass; RED 8/8 failing before 1676756; each close trigger mutation-checked)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Shell visuals and CSS motion (sticky header, 2px bars, panel fade/settle, reduced-motion, focused skip link) as rendered in a browser"
    requirement: SHELL-02
    verification:
      - kind: other
        ref: "@tailwindcss/node compile of app/globals.css: every new utility emits the intended rule (z-(--z-*), duration-(--duration-*), starting:, transition-discrete, data-[state=*], motion-reduce:transition-none, max-h calc, focus:not-sr-only without clip)"
        status: pass
    human_judgment: true
    rationale: "jsdom applies no CSS; the shell is first rendered on a route in 07-22, whose CI visual run and review cover layout and motion"

duration: about 9 min (plan start 19:56:20Z, last task commit 77010e7 20:05:00Z)
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 21: Identity data and shell components, verified in jsdom (build step 9, part 1)

**`data/site.ts` now holds Tim's identity as one typed `satisfies Site` object, including the email and LinkedIn URL he supplied at the Task 1 checkpoint. `1ae6ea8` builds SkipLink, SiteNav (desktop list with `aria-current` and a 2px accent bar, plus a router-free static variant), SiteFooter (GitHub, LinkedIn and `mailto:` links, server-computed year) and SiteChrome. `1676756` adds the mobile disclosure menu with all six close triggers and CSS-only motion. 15 jsdom tests pass. `77010e7` removes a v1 `.sr-only` copy that kept a focused skip link clipped to nothing. Nothing is mounted yet; 07-22 does that.**

## Performance

- **Duration:** about 9 min (plan start 19:56:20Z; `1ae6ea8` 19:59:42Z, `bfb981b` 20:00:37Z, `1676756` 20:04:13Z, `77010e7` 20:05:00Z)
- **Tasks:** 3/3 (Task 1 resolved by Tim's reply; Tasks 2 and 3 executed)
- **Files modified:** 9 (7 created, 2 modified)

## Task 1 input (checkpoint:human-input, blocking-human)

Tim's literal reply in this session: "approved - old2shatterhand@gmail.com - https://www.linkedin.com/in/luitim/". Written verbatim:

| Field | Value in `data/site.ts` |
|-------|-------------------------|
| `email` | `old2shatterhand@gmail.com` |
| `links.linkedin` | `https://www.linkedin.com/in/luitim/` (trailing slash kept) |

The values came only from Tim's reply. They were not taken from git config or account metadata.

## Accomplishments

- **Identity (SHELL-03):** `site` = name `Tim Lui`, role `Developer & photographer`, the two values above, GitHub `https://github.com/tlex-web`, and nav Home `/`, Photographs `/photos`, Engineering `/projects`, Roadmap `/roadmap`, Contact `/contact`. `Site` types `email` and `links.linkedin` as required `string`.
- **SkipLink:** first focusable element, `sr-only` until focused, then fixed at 16/16 with `z-(--z-skip)`, `min-h-11`, accent fill and `ink-inverse` text.
- **SiteNav default (SHELL-01):** sticky solid `h-16` header (`z-(--z-nav)`, `border-line`), `<nav aria-label="Primary">`, wordmark `Tim Lui` (accessible name `Tim Lui, home`). Desktop list items are `min-h-11 px-4`, weight 400, `ink-muted` to `ink` on hover with `duration-(--duration-fast) ease-erosion`. The current item gets `aria-current="page"` and a 2px accent bar inset 16px left/right and 8px from the bottom. `/` matches exactly; the others also match their sub-paths.
- **Mobile menu (SHELL-02):** `<button aria-expanded aria-controls="site-menu">` (`min-h-11 min-w-11`, `touch-manipulation`, `cursor-pointer`) with `List`/`X` at 24px (`aria-hidden`) and the visible text "Menu" in both states. The `#site-menu` panel sits inside the same nav and uses `hidden` when closed. Rows are `min-h-12` Schibsted `text-heading` 400 with `gap-2`; the current row has a 2px left bar inset 8px top and bottom. It closes on route change, Escape (focus returns to the button), a second press, pointerdown outside the header, focus moving outside the header, and `(min-width: 768px)`. Listeners exist only while it is open. There is no scroll lock, focus trap or `inert`.
- **Motion:** CSS only, keyed on `data-state`. On open, the panel fades in and moves from -8px over `--duration-panel` with `ease-geological` (`@starting-style`). On close, it fades out over `--duration-fast` with `ease-descent` (`transition-discrete`, so `display` flips after the fade). `motion-reduce:transition-none` removes the transition, and the translate only exists under `motion-safe:`. SiteNav and SiteFooter import nothing from `motion/react`.
- **Static variant:** the same header and nav with plain `<a>` elements in a wrapping row. It has no `usePathname`, no `aria-current` and no button; the test asserts `usePathname` is never called.
- **SiteFooter:** `bg-surface-raised`, `py-12`, two columns from md. It shows the identity `<p>`s and a `<ul aria-label="Elsewhere">` of GitHub (`GithubLogo`), LinkedIn (`LinkedinLogo`) and Email (`EnvelopeSimple`), each a 20px `aria-hidden` icon, opening in the same tab. The bottom row reads `© {year} Tim Lui. All rights reserved.` with `tabular-nums`.
- **SiteChrome:** SkipLink, SiteNav, `<main id="main-content" tabIndex={-1}>`, SiteFooter. The default variant mounts inside MotionProvider; the static variant does not.

## Task Commits

1. **Task 1 (checkpoint:human-input):** resolved by Tim's reply; no commit.
2. **Task 2 (tracer): identity data and SiteChrome** - `1ae6ea8` (feat). Tracer gate: all `<verify>` checks are automated and `human_verify_mode` is the default end-of-phase, so the checks were re-run green and expansion continued without a checkpoint.
3. **Task 3 (auto, tdd): mobile disclosure menu**
   - RED `bfb981b` (test): `npx jest components/site/__tests__/SiteNav.test.tsx` exit 1, **8 failed / 8 total**. Every failure was `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Menu"` against the Task 2 SiteNav. The record is in `.git/gsd-red/07-21-red.json`.
   - GREEN `1676756` (feat): SiteNav 8/8 and SiteChrome 7/7.
4. **Rule 1 fix:** `77010e7` (fix) removes the v1 `.sr-only`/`.not-sr-only` copies (deviation 3).

`git rev-list --count fbcd74a..HEAD` = 4, measured from the plan ledger.

## TDD Gate Compliance

- The RED commit `bfb981b` (`test(07-21)`) comes before the GREEN commit `1676756` (`feat(07-21)`). No refactor commit was needed.
- **RED evidence, semantic assessment:** valid. The suite loaded and found all 8 target tests. Each one failed inside its test body on the planned "Menu" button query, not on an import, syntax or fixture error.
- **Machine classifier:** `gsd-tools check tdd-red-evidence .git/gsd-red/07-21-red.json` returns `INVALID_RED / invalid_record`. Jest's default reporter is not a supported format, no TAP or JUnit reporter is installed, and installing one (`jest-junit`) would be a package install, which this plan excludes (T-07-SC). The gate is advisory here: the plan type is `execute` and `tdd_mode` is off. The RED evidence above is the real, unmodified run output.
- **Mutation checks (GREEN):** I disabled one trigger at a time: Escape, pointerdown, focusout, matchMedia and route change. Each time, exactly the matching test failed and the other 7 passed.

## Files Created/Modified

- `data/types.ts` - `NavItem`, `Site`.
- `data/site.ts` - identity, links, nav.
- `components/site/SkipLink.tsx`, `SiteNav.tsx`, `SiteFooter.tsx`, `SiteChrome.tsx` - the shell.
- `components/site/__tests__/SiteChrome.test.tsx` (7), `SiteNav.test.tsx` (8).
- `app/globals.css` - shell layout variables in `:root`; `scroll-padding-top: calc(var(--nav-h) + 16px)` added to the existing `html` block; v1 `.sr-only`/`.not-sr-only` removed.

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- Tim's two values were used verbatim.
- RED and GREEN were committed separately.
- The static header uses `min-h-16`.
- The desktop list comes before the button in DOM order.
- The 2px bars use `h-0.5`/`w-0.5`.
- A null `relatedTarget` does not close the menu.
- The v1 `.sr-only` is removed.

The `ui-ux-pro-max` skill was loaded before any component was written. Its checks (skip-links, focus states, focus-not-obscured, touch-target-size, touch-spacing, tap-delay, nav-state-active, color-not-only, reduced-motion, exit-faster-than-enter) match the locked contract, and nothing in the contract was changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Static nav header `min-h-16` instead of `h-16`**
- **Found during:** Task 2.
- **Issue:** the plan says the static variant uses "the same header" (`h-16`) with an always-visible `flex flex-wrap` row. At 375px, the wordmark plus five links wrap to about three rows (around 130px). A fixed 64px header would let them spill over `main`.
- **Fix:** the static header and nav row use `min-h-16`, so they start at 64px and grow. The default variant keeps `h-16`.
- **Files:** `components/site/SiteNav.tsx`. **Commit:** `1ae6ea8`.

**2. [Rule 1 - Bug] DOM order: desktop list before the Menu button and panel**
- **Found during:** Task 3 GREEN. The "Tab past the last menu link" test failed because focus moved into the desktop list.
- **Issue:** with the button and panel placed before the desktop `<ul>`, Tab from the last menu link went to the desktop links. That is invisible below md in a browser, but it is also inside the header, so focus did not leave and the menu did not close in jsdom. The order also differed from the visual order on desktop.
- **Fix:** the order is now wordmark, desktop `<ul>`, button, panel. The panel follows the button directly, so the next Tab after the button reaches the first menu link.
- **Commit:** `1676756`.

**3. [Rule 1 - Bug] The focused skip link was invisible (v1 `.sr-only` clip)**
- **Found during:** Task 3, while checking the compiled CSS with `@tailwindcss/node`.
- **Issue:** `app/globals.css` `@layer utilities` had a hand-written v1 `.sr-only` with `clip: rect(0, 0, 0, 0)`, emitted alongside Tailwind v4's own `.sr-only`. `focus:not-sr-only` resets `clip-path` but not `clip`, so the focused, fixed-position SkipLink stayed clipped to nothing. This would fail SHELL-01 in a browser even though jsdom passes. The existing `Hero3DMountain` skip link had the same latent bug.
- **Fix:** both v1 copies are deleted, leaving Tailwind's built-in pair (`clip-path: inset(50%)` and `clip-path: none`). I checked in the compiled output that `.sr-only` no longer carries `clip` and that the focus utilities come after `focus:not-sr-only` (position fixed and `px-4` win).
- **Regression risk:** unfocused elements stay visually hidden (1px, clipped), so no baseline should move. This is unverified in CI because nothing was pushed.
- **Commit:** `77010e7`.

**4. [Process] Four task commits instead of two.** The RED/GREEN split follows tdd.md, and the fix commit keeps the globals.css change reviewable on its own.

---

**Total deviations:** 3 auto-fixed (3 bugs) plus 1 process note.
**Impact on plan:** all three are correctness fixes inside the plan's own files. No scope creep. Deviation 3 also repairs the Hero skip link.

## Issues Encountered

- None blocking.

### Full checks (after `77010e7`)

| Check | Result |
|-------|--------|
| `npx jest components/site/__tests__/SiteChrome.test.tsx` (Task 2 verify) | 7 passed / 7 (6 or more required) |
| `npm run type-check && npm run lint` (Task 2 verify) | exit 0. ESLint: 0 errors, 54 warnings, all pre-existing and none in `components/site/**` or `data/site.ts`. parity OK; `palette: OK`; `contrast: OK (28 pairs)`; `selftest: 45/45` |
| Identity-value node check (Task 2 verify) | `identity values OK` |
| `npx jest SiteNav.test.tsx SiteChrome.test.tsx` (Task 3 verify) | 15 passed / 15 (14 or more required) |
| `npm run type-check && npm run lint && npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (Task 3 verify) | exit 0. Jest 11 suites, 97/97. `test-count: jest 97 + e2e 72 = 169 (baseline 91)`, `test-count: OK`. `jest-results.json` is gitignored (`/jest-results.json`) and not committed |
| `npx jest --silent` after `77010e7` | 11 suites, 97/97 |
| Task 2 acceptance criteria | `data/site.ts` has `name: 'Tim Lui'`, `role: 'Developer & photographer'`, `github: 'https://github.com/tlex-web'` and `satisfies Site` (4/4). `data/types.ts:85 email: string;` and `:88 linkedin: string;`, no `?`. `motion/react` count in SiteNav + SiteFooter = 0 + 0. SiteFooter has `aria-label="Elsewhere"` and `@phosphor-icons/react/dist/ssr`. PASS |
| Task 3 acceptance criteria | SiteNav contains `aria-controls="site-menu"` (1), `aria-expanded` (2), `min-h-12` (1), `motion-reduce:` (1), `hidden={` (1). `inert` 0; `overflow = 'hidden'` 0. SiteNav.test.tsx 8/8. PASS |

## Known Stubs

None. No placeholders: the identity values are real and the format check passes.

## Threat Flags

None new.
- **T-07-28 (identity spoofing):** mitigated. Blocking-human input, required string types, and the Task 2 format check (rejects placeholders and example.com). The 07-25 identity guard is still to come.
- **T-07-29 (contact email disclosure):** accepted by design. Tim chose the public address.
- **T-07-SC:** no package installs. `jest-junit` was deliberately not installed (see TDD Gate Compliance).

## User Setup Required

None from this plan.

## Next Phase Readiness

- **Ready for 07-22** (shell mount: route-group `git mv`, SiteChrome in the `(site)` layout, MotionProvider moved out of the root layout). `SiteChrome` takes `children` and `variant`; `variant="static"` is for `global-error` (07-23).
- **07-22 CI visual run** will be the first browser render of the shell. It also covers three global CSS changes that are already live but not yet CI-verified because nothing was pushed here: `html { scroll-padding-top }`, the new `:root` variables (inert) and the `.sr-only` removal (unfocused pixels unchanged). If a baseline moves without the shell, check `scroll-padding-top` on anchor scrolls first.
- **07-25** can now point Contact's Email card and the forbidden-strings/identity guard at `site.email` and `site.links.linkedin`. `package.json` `author` is still `Your Name <your.email@example.com>` (07-25 scope).
- **SHELL-01/02/03 stay Pending:** 07-22 (all three), 07-23 (SHELL-01) and 07-25 (SHELL-03) still declare them.

## Self-Check: PASSED

- All 7 created files exist on disk.
- `1ae6ea8`, `bfb981b`, `1676756` and `77010e7` are ancestors of HEAD. `git rev-list --count fbcd74a..HEAD` = 4.
- Acceptance criteria for Tasks 2 and 3 and the plan-level verification were re-run (table above) and pass.

## Post-close fix

- **What regressed:** CI run 40016881820 (ci/07-21, tip 0577637) failed Visual Regression only on home scroll-0 at 375/768/1440, dark and light. At scrollY 0 the hero h1, pill, subtitle and "Scroll to explore" rendered at about 70% opacity. Nothing moved, and every other shot matched pixel for pixel.
- **Root cause:** the `html { scroll-padding-top: calc(var(--nav-h) + 16px) }` from `1ae6ea8`. `Hero3DMountain.tsx` and `MountainTerrain3D.tsx` call `useScroll({ target, offset: ['start start', 'end start'] })`. Motion 14.1.0 turns that into a native `ViewTimeline` with no inset, and a ViewTimeline's `auto` inset is the scroll container's scroll-padding. The 80px padding pushed progress to about 0.09 at the top, so the `[0, 0.3] -> [1, 0]` opacity transform gave about 0.7.
- **Tim's choice:** A, "scroll-margin on targets (Recommended)".
- **Fix (`5544cc3`, app/globals.css only):** the `html` scroll-padding is gone. `@layer base` now has `:where(*) { scroll-margin-top: calc(var(--nav-h) + 16px); }`. Scroll-into-view (focus, anchors) honours the target's scroll-margin and ViewTimeline ignores it. `:where()` keeps specificity at 0, so `scroll-mt-*` utilities still override it.
- **UI-SPEC "Scroll offset" row:** the intent stays the same (the sticky nav never hides focused or anchored content, WCAG 2.2 focus-not-obscured). It is now implemented with `scroll-margin-top` on the targets, not `scroll-padding-top` on `html`. The row's literal CSS is out of date. Treat this addendum as the source of truth.
- **Local checks:** `grep -c scroll-padding app/globals.css` = 0. `npm run build` passes, and the emitted CSS has `:where(*){scroll-margin-top:calc(var(--nav-h) + 16px)}` inside `@layer base`. `npm run lint` (full chain, selftest 45/45), `npm run type-check` and `npx jest --silent` (97/97) all pass. `e2e/homepage.spec.ts` on chromium passes 5/5. On the production build in Chromium with `reducedMotion: 'no-preference'`, a probe read hero h1 opacity 1 and wrapper chain opacity 1 at scrollY 0 for 375, 768 and 1440 (html scroll-padding-top `auto`, h1 scroll-margin-top `80px`). The 07-20 baselines are expected to show no visual diff. The orchestrator confirms this in CI.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
