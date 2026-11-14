---
phase: 14-ui-fixes-terminal-controls
verified: 2026-11-14T16:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - .planning/phases/14-ui-fixes-terminal-controls/14-01-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-01-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-02-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-02-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-03-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-03-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-04-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-04-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-05-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-05-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-06-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-06-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-07-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-07-SUMMARY.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-08-PLAN.md
  - .planning/phases/14-ui-fixes-terminal-controls/14-08-SUMMARY.md
  - components/home/AscentHero.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/PhotoViewer.tsx
  - components/projects/DemoTerminal.tsx
  - components/site/SiteNav.tsx
  - e2e/case-study.spec.ts
  - e2e/home-modes.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/routes.spec.ts
  - lib/demo-terminal.ts
covered_digest: "v4:sha256:92be5aab1aba007ea99648fff3e8daf89e69e992b1ec01a0ee24f40b877f1cdb"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Repeat Tim's 12-UAT test 3 keyboard check: at 1366x650, 1280x560 and 720x450 open a photo, step with the arrow keys, close with Escape, and watch where focus lands; then open the mobile menu at 375 px and Tab through every row"
    expected: "After Escape, focus is on the current photo's trigger and the ring is fully on screen below the nav. In the menu every focus ring is whole at the sides, top and bottom, and tapping the current page's link closes the menu without a page jump"
    why_human: "This is Tim's own hands-on re-check of the original v2.0 finding (LBOX-08, SHELL-08). The e2e rows cover the same geometry, but 14-VALIDATION.md lists it as Manual-Only and it has not been done. Chrome could not reach local servers during the DOM verification pass, so no live-DOM look backs it either."
---

# Phase 14: UI Fixes & Terminal Controls Verification Report

**Phase Goal:** The UI bugs carried from v2.0 are gone for keyboard, touch and narrow-screen visitors, and the terminal demo can be stepped through and read without motion.
**Verified:** 2026-11-14
**Status:** human_needed
**Re-verification:** No, initial verification

All five roadmap success criteria are backed by code I read, not only by the SUMMARYs. The one open item is Tim's manual keyboard re-check, which the validation file already lists as manual-only. No gaps were found.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a phone, tapping the current page's link in the mobile menu closes the menu, and every focus ring in the menu is fully visible at 375 px | VERIFIED | `components/site/SiteNav.tsx` panel `Link` has an `onClick`. A plain tap (button 0, no modifier) on the link with `href === pathname` default-prevents only when `location.search === ''` (D-23), focuses the Menu button with `preventScroll`, then `setOpen(false)`. Panel links carry `focus-visible:-outline-offset-4`, so the ring sits inside the row. `revealFocusedRow` scrolls the panel on `:focus-visible` only (the WR-01 fix). `app/globals.css` is unchanged since `c3a06b3` (empty diff), so the global ring is untouched. Rows exist in `e2e/shell.spec.ts` (lines 332, 383, 479, 491) and a new `menu/375-current-focus` baseline is committed in `55160a4`. |
| 2 | Home has no horizontal overflow at 375 px, fixed at the element rather than by hiding overflow on `body` or `main` | VERIFIED | `e2e/home-modes.spec.ts` lines 373-420 assert `documentElement.scrollWidth <= clientWidth` at the hero, 4 waypoints, the summit, About and the footer, in static, reduced-motion, live 3D (`@chromium-only`) and no-JavaScript modes, with a count assertion so a missing stop fails. `git grep overflow-x -- app components` returns nothing, so there is no overflow hiding on html, body or main. Research found nothing overflowing, so the requirement is closed as already fixed in 09-01 and now guarded; the roadmap wording is met. |
| 3 | Every altimeter rail tick label keeps at least 4.5:1 over the live canvas and the poster, and the scrim covers the full label run | VERIFIED | `components/home/AscentHero.tsx:92` scrim is still `w-56 hidden md:block` with stops `from-surface/90 from-0% via-surface/85 via-85% to-transparent`. B8 is rewritten in place (`home-modes.spec.ts:535-660`): geometry rows at 768/1023/1280/1440 px assert `scrim.offsetWidth === 224` and every label inside the dense stop. Pixel rows assert a worst-pixel contrast of at least 4.5 for every `[data-tick-label]` at every waypoint stop and the summit, on the poster (three engines) and on the live canvas (Chromium). The rail and scrim are `md:` only, so the 768 px lower bound is the lowest breakpoint that has them. |
| 4 | After stepping in the lightbox and closing with Escape, focus returns to the current photo's visible trigger and never lands off-screen, with a regression test | VERIFIED | `LightboxDialog.tsx` `restoreFocus` focuses `[data-photo-id={slug}]` with `preventScroll`, calls `revealTrigger` (window-only scroll, 4 px ring clearance, `--nav-h` aware, instant, whole-pixel rounding), then repeats once in the next animation frame while the mark still holds focus. The root cause (the browser's scroll restoration after the history traversal) is recorded in the doc comment. `history.scrollRestoration` is never set (grep shows only the comment). `e2e/photos-lightbox.spec.ts:776` is a 14-row matrix (Map, Grid and Carousel across 4 viewports with Escape, plus Close photo and Back) that first proves the trigger is off-screen. Only Map 720x450 runs in Firefox and WebKit; the rest is Chromium by design. The IN-01 Escape order is fixed in `PhotoViewer.tsx`: `setLabels(on)` clears `expandedId` on hide, and `collapseCallout` returns false when no label or row is visible. |
| 5 | The terminal demo has previous and next buttons and a static transcript in a disclosure that is open by default under reduced motion | VERIFIED | `components/projects/DemoTerminal.tsx` renders `Previous command` and `Next command` around the dots in `role=group "Commands"`, driven by `stepTo` in `lib/demo-terminal.ts` (null at either end, so the end press changes nothing and the buttons carry `aria-disabled`). Step and dot presses go through `show()` and set the sticky Pause. A server-rendered `details[data-transcript]` follows the region and lists every command with `samp` output exactly as captured. A mount-only effect opens it when `(prefers-reduced-motion: reduce)` matches; the server HTML has no `open` attribute. It renders only for 2 or more commands. Wired into the case-study page through `components/projects/sections/Demo.tsx`. e2e rows are at `case-study.spec.ts` lines 601-1000 (steps, ends, 375 px bar, transcript default, reduced motion, no-JS, Pause coupling, 375 px sweep). |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

Each behavior-dependent truth (close, Escape order, focus return, Pause coupling) has a named e2e or Jest row that passed. CI run 43600436335 on `55160a4` shows E2E 1471 rows green in Chromium, Firefox and WebKit with `--fail-on-flaky-tests`, Visual Regression 98, and Unit Tests with `guard:tests`.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/site/SiteNav.tsx` | Current-page tap close, inset ring | VERIFIED | Exists, substantive, wired into the layout |
| `components/home/AscentHero.tsx` | Deeper scrim, same width | VERIFIED | Stops changed, element and width unchanged |
| `components/photos/LightboxDialog.tsx` | `revealTrigger` and the post-restoration re-reveal | VERIFIED | Called from `restoreFocus` on every close path |
| `components/photos/PhotoViewer.tsx` | `setLabels` and the `collapseCallout` guard | VERIFIED | Both toggles go through `setLabels`; no effect on `labelsOn` |
| `lib/demo-terminal.ts` | `stepTo` | VERIFIED | Imported and used by `DemoTerminal` |
| `components/projects/DemoTerminal.tsx` | Step buttons, sticky Pause, transcript | VERIFIED | Rendered by `sections/Demo.tsx` from `project.demo.commands` |
| `e2e/shell.spec.ts`, `home-modes.spec.ts`, `photos-lightbox.spec.ts`, `case-study.spec.ts`, `e2e/visual/routes.spec.ts` | New and rewritten rows | VERIFIED | Rows found by name; the visual baselines are committed in `55160a4` |
| `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` | Rows 6 and 30 written back | VERIFIED | Both rows append the Phase 14 outcome with commit SHAs; the enum and Tim's column are untouched |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `SiteNav` panel link `onClick` | `setOpen(false)` and `buttonRef.focus` | WIRED | Same handler, focus first (matches Escape's order) |
| `LightboxDialog` unmount microtask | `restoreFocus` then `revealTrigger` | WIRED | Covers Escape, Close photo and browser Back |
| `PhotoViewer` Hide labels button and H key | `setLabels` | WIRED | `setLabels(!labelsOn)` at both call sites |
| `DemoTerminal` Previous, Next and dots | `show(stepTo/goTo)` then `setOverride(true)` | WIRED | |
| `DemoTerminal` transcript | `onTranscriptToggle` presses Pause | WIRED | Reduced-motion open sets `.open` directly, so it changes no state |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| `DemoTerminal` transcript | `commands` | `project.demo.commands` from `data/projects.ts`, rendered raw (`command.output`) | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Jest for the touched areas | `npx jest components/projects components/site components/photos lib/demo-terminal` | 25 suites, 328 tests passed | PASS |
| Full Jest (orchestrator, after the review fixes) | Jest | 1797/1797 | PASS |
| e2e (not re-run here, no server started) | CI run 43600436335 plus the orchestrator's local runs after the fixes | 1471 CI rows green; shell 74 and case-study 34 local rows green | PASS (reported) |

### Probe Execution

Step 7c: SKIPPED. The phase declares no probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SHELL-07 | 14-01, 14-07, 14-08 | SATISFIED | Truth 1 |
| SHELL-08 | 14-01, 14-07, 14-08 | SATISFIED | Truth 1; the manual re-check is below |
| HOME-09 | 14-02, 14-07, 14-08 | SATISFIED | Truth 2 |
| HOME-10 | 14-02, 14-07, 14-08 | SATISFIED | Truth 3 |
| LBOX-08 | 14-03, 14-04, 14-07, 14-08 | SATISFIED | Truth 4; the manual re-check is below |
| ENG-06 | 14-05, 14-06, 14-07, 14-08 | SATISFIED | Truth 5 |

All six IDs appear in the PLAN frontmatter and are marked Complete in REQUIREMENTS.md (lines 27-31, 69; traceability rows 130-134 and 157). There are no orphaned requirements: REQUIREMENTS.md maps no other ID to Phase 14.

### Prohibitions (must_haves.prohibitions)

Every prohibition in the plans is `verification: judgment`, `status: resolved`; none is test-tier. My non-authoritative judgment, checked against the code where it could be:

| Prohibition | Judgment |
|-------------|----------|
| Do not weaken the global focus ring (14-01) | Held: `app/globals.css` has no diff since `c3a06b3`, and the fix is a scoped class on panel links |
| Do not make the menu modal (14-01) | Held: no focus trap and no scroll lock in `SiteNav.tsx` |
| No `overflow-x: hidden` on html, body or main (14-02) | Held: `git grep overflow-x -- app components` is empty |
| Do not change the scrim's width, element or position (14-02) | Held: still `w-56`, asserted `offsetWidth === 224` |
| Do not set `history.scrollRestoration` (14-03) | Held: only a comment mentions it |
| Do not clear `expandedId` from an effect on the labels preference (14-04) | Held: cleared in `setLabels` only |
| No terminal interactions beyond Previous and Next (14-05) | Held: `DemoTerminal` has no key handler |
| Do not reformat captured output (14-06) | Held: `<samp>{command.output}</samp>` renders it raw |
| Ledger write-back is append-only (14-07) | Held for rows 6 and 30 |
| Tim alone commits the PNGs; no push without approval (14-08) | PNGs landed in `55160a4` authored by `tlex-web`. Approval is recorded in the SUMMARY, which I did not re-verify. |

### Anti-Patterns Found

No `TBD`, `FIXME` or `XXX` markers in the files changed by the phase. No stubs: every artifact is substantive and wired.

### Findings classified

- **BLOCKER:** none.
- **WARNING:** the manual keyboard re-check below is open.
- **Info (not blocking):**
  - The three review fixes (b8f3b1f, ea7d7f2, 050b15b) are local and unpushed, so CI has not run on them. Local evidence is green; the phase PR will confirm.
  - 6 review info items (IN-01 to IN-06) are deferred to Phase 15 by Tim's choice, recorded in `14-REVIEW-DISPOSITION.md`.
  - `14-DOM-VERIFY.md` has no live-DOM look for any wave (could_not_look). The e2e rows cover the criteria in place of it.
  - The UI review scored 20/24, advisory only.
  - The LBOX-08 matrix runs three engines for one row only (Map 720x450 with Escape); the other 13 rows run in Chromium. This follows the plan (D-11).

### Deferred Items

None. The `ROADMAP.md` fallback proof for Deployment Checks was retired in 14-08 (D-20).

### Human Verification Required

#### 1. Tim's keyboard re-check (12-UAT test 3)

**Test:** At 1366x650, 1280x560 and 720x450, open a photo, step with the arrow keys, close with Escape and see where focus lands. Then, at 375 px, open the menu, Tab through every row, and tap the current page's link.
**Expected:** Focus lands on the current photo's trigger with its whole ring visible below the nav. Every menu focus ring is whole at the sides, top and bottom. Tapping the current page closes the menu with no jump.
**Why human:** This is the hands-on check that originally found the bug. It is listed Manual-Only in 14-VALIDATION.md and has not been done.

### Gaps Summary

No gaps. All five success criteria are met by code I inspected and by tests that passed in CI. The status is `human_needed` only because Tim's manual keyboard re-check is outstanding. Once Tim confirms it, the phase can ship.

---

_Verified: 2026-11-14_
_Verifier: Claude (gsd-verifier)_
