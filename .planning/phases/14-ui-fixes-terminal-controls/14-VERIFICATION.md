---
phase: 14-ui-fixes-terminal-controls
verified: 2026-11-14T17:00:00Z
status: passed
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
covered_digest: "v4:sha256:a4ee87e2e3dadaa522dcc0bccb6f27467620c1aec3736dec7d109ba47dcf43e9"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 14: UI Fixes & Terminal Controls Verification Report

**Phase Goal:** The UI bugs carried from v2.0 are gone for keyboard, touch and narrow-screen visitors, and the terminal demo can be stepped through and read without motion.
**Verified:** 2026-11-14 (HEAD `fc17c97`)
**Status:** passed
**Re-verification:** Yes. The previous report (passed after 14-UAT, 5/5) went stale because quick task 261114-o8w changed `components/site/SiteNav.tsx` and `e2e/shell.spec.ts` (commits `ce35776`, `d038117`). This pass re-read the current code, with most attention on SHELL-07 and SHELL-08 in `SiteNav.tsx`, and regenerated the fingerprint with the CLI.

## What changed since the last report

`git diff 9c6c377 HEAD -- . ':!.planning'` lists exactly two files and nothing else, so every other covered source file is byte-identical to what the previous report inspected:

- `components/site/SiteNav.tsx`: one line of behaviour, `buttonRef.current?.focus()` became `buttonRef.current?.focus({ preventScroll: true })` in the open menu's Escape handler (line 140), plus a comment (lines 132-136). The tap-close handler is unchanged and already used `preventScroll` (line 252).
- `e2e/shell.spec.ts`: the row "Menu button and panel rows meet the touch-target sizes; Escape closes to the button" now pins the page to scrollY 600 (capped at the maximum) with focus already in the panel, presses Escape, and asserts `window.scrollY` is unchanged ("Escape keeps the scroll position"). The existing assertions (panel hidden, `aria-expanded=false`, Menu focused) are kept.

The fix is correct and consistent. Before it, Escape moved focus with a plain `focus()`, and the global `scroll-margin-top` (nav height + 16 px) made the browser scroll the page up. The quick task's summary records RED at 600 to 530 in Chromium and 600 to 185.5 in Firefox. Escape now follows the same rule as the tap close.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On a phone, tapping the current page's link in the mobile menu closes the menu, and every focus ring in the menu is fully visible at 375 px | VERIFIED | `SiteNav.tsx:232-254`: the panel `Link` `onClick` takes a plain activation (button 0, no modifier) on the link where `item.href === pathname`. It default-prevents only when `window.location.search === ''` (D-23), calls `focus({ preventScroll: true })` on Menu, then `setOpen(false)`. Escape (line 137-142) does the same focus-then-close with `preventScroll`, so both close paths leave the page where it was. The panel links carry `focus-visible:-outline-offset-4` (line 258), so the 2 px ring sits inside the row and the panel's `overflow-y-auto` cannot clip it. `revealFocusedRow` (lines 72-81) scrolls the panel only, on `:focus-visible` only (the WR-01 fix). `app/globals.css` has no diff since `c3a06b3`, so the global ring is untouched. Rows: `e2e/shell.spec.ts` (tap-close, focus-ring and the extended Escape row), and the `menu/375-current-focus` baseline from `55160a4`. |
| 2 | Home has no horizontal overflow at 375 px, fixed at the element rather than by hiding overflow on `body` or `main` | VERIFIED | `git grep overflow-x -- app components` returns nothing, so nothing hides overflow on html, body or main. `e2e/home-modes.spec.ts` (lines 373-420) asserts `documentElement.scrollWidth <= clientWidth` at the hero, four waypoints, the summit, About and the footer, in static, reduced-motion, live 3D and no-JavaScript modes. Research found nothing overflowing, so the requirement is closed as already fixed in 09-01 and now guarded. |
| 3 | Every altimeter rail tick label keeps at least 4.5:1 over the live canvas and the poster, and the scrim covers the full label run | VERIFIED | `components/home/AscentHero.tsx:92`: scrim is `w-56 hidden md:block` with `from-surface/90 from-0% via-surface/85 via-85% to-transparent`. The file is unchanged since the last report. B8 in `home-modes.spec.ts` asserts scrim `offsetWidth === 224`, every label inside the dense stop, and a worst-pixel contrast of at least 4.5 per label on the poster (three engines) and the live canvas (Chromium). |
| 4 | After stepping in the lightbox and closing with Escape, focus returns to the current photo's visible trigger and never lands off-screen, with a regression test | VERIFIED | `LightboxDialog.tsx`: `revealTrigger` (line 127) is called from `restoreFocus` after `mark.focus({ preventScroll: true })` (lines 167-168) and again in the next frame while the mark still holds focus (line 170). The root cause (browser scroll restoration after the history traversal) is in the doc comment at line 151, and `history.scrollRestoration` is never set (grep shows only that comment). `PhotoViewer.tsx` routes both the button and the H key through `setLabels` (lines 326, 332, 553), and `collapseCallout` (line 353) backs the Escape order (the IN-01 fix). `e2e/photos-lightbox.spec.ts` has the 14-row matrix. Independently of CI, 14-UAT ran the same keyboard flow on 2026-11-14 in Edge and Firefox. |
| 5 | The terminal demo has previous and next buttons and a static transcript in a disclosure that is open by default under reduced motion | VERIFIED | `DemoTerminal.tsx`: `Previous command` (line 386) and `Next command` (line 419) call `show(stepTo(state.index, -1 or 1, count))`. `stepTo` (`lib/demo-terminal.ts:109`) returns null at either end. A server-rendered `details[data-transcript]` (line 432) follows the region, and a mount-only effect (line 241) opens it when `(prefers-reduced-motion: reduce)` matches. `components/projects/sections/Demo.tsx` imports and renders `DemoTerminal` with `project.demo.commands`. e2e rows are in `case-study.spec.ts`. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified).

The behavior-dependent truths (menu close with focus and scroll preservation, Escape order, lightbox focus return, Pause coupling) each have a named e2e or Jest row. That includes the new Escape scroll assertion. The 14-UAT run exercised the same menu and lightbox behaviour by hand, on a real browser.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/site/SiteNav.tsx` | Current-page tap close, inset ring, Escape without scroll jump | VERIFIED | Read in full at HEAD. Substantive, wired into the layout |
| `components/home/AscentHero.tsx` | Deeper scrim, same width | VERIFIED | Line 92 |
| `components/photos/LightboxDialog.tsx` | `revealTrigger` and the post-restoration re-reveal | VERIFIED | Lines 127, 167-170 |
| `components/photos/PhotoViewer.tsx` | `setLabels` and the `collapseCallout` guard | VERIFIED | Lines 326, 353, 553 |
| `lib/demo-terminal.ts` | `stepTo` | VERIFIED | Line 109, imported by `DemoTerminal` |
| `components/projects/DemoTerminal.tsx` | Step buttons, sticky Pause, transcript | VERIFIED | Rendered by `sections/Demo.tsx` |
| `e2e/shell.spec.ts`, `home-modes.spec.ts`, `photos-lightbox.spec.ts`, `case-study.spec.ts`, `e2e/visual/routes.spec.ts` | New and rewritten rows | VERIFIED | Present; visual baselines committed in `55160a4` |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `SiteNav` panel link `onClick` | `buttonRef.focus({ preventScroll })` then `setOpen(false)` | WIRED | Lines 252-253 |
| `SiteNav` Escape listener | `buttonRef.focus({ preventScroll })` then `setOpen(false)` | WIRED | Lines 140-141, capture listener attached only while open |
| `LightboxDialog` unmount | `restoreFocus` then `revealTrigger` | WIRED | Covers Escape, Close photo and browser Back |
| `PhotoViewer` Hide labels button and H key | `setLabels` | WIRED | |
| `DemoTerminal` Previous, Next and dots | `show(stepTo/goTo)` then sticky Pause | WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| `DemoTerminal` transcript | `commands` | `project.demo.commands` from `data/projects.ts`, rendered raw | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Jest for the touched areas | `npx jest components/site components/projects components/photos lib/demo-terminal` | 25 suites, 328 tests passed | PASS |
| Type check | `npx tsc --noEmit` | No output (clean) | PASS |
| Escape scroll fix (e2e) | Not re-run here (no server or Playwright by instruction) | Reported by the quick task summary: RED 600 to 530 (Chromium) and 600 to 185.5 (Firefox) before, 98 shell rows green in Chromium and Firefox after, Jest SiteNav 14/14, ESLint clean. The code diff matches the claim | PASS (reported) |
| Keyboard and touch flows in real browsers | 14-UAT, 2026-11-14 | 20/20 checks, Edge and Firefox (see Human Verification) | PASS (reported) |

CI run 43600436335 on `55160a4` (E2E 1471 rows green in three engines, Visual 98, Unit Tests) predates the review fixes and the quick task; those are local and unpushed. The phase PR's CI will cover them.

### Probe Execution

Step 7c: SKIPPED. The phase declares no probe scripts.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| SHELL-07 | 14-01, 14-07, 14-08 | SATISFIED | Truth 1; tap close plus the Escape path, neither jumps the page |
| SHELL-08 | 14-01, 14-07, 14-08 | SATISFIED | Truth 1; inset ring; UAT confirmed the rings whole on /photos and /roadmap at 375 px |
| HOME-09 | 14-02, 14-07, 14-08 | SATISFIED | Truth 2 |
| HOME-10 | 14-02, 14-07, 14-08 | SATISFIED | Truth 3 |
| LBOX-08 | 14-03, 14-04, 14-07, 14-08 | SATISFIED | Truth 4; UAT confirmed focus lands on the trigger at all three sizes |
| ENG-06 | 14-05, 14-06, 14-07, 14-08 | SATISFIED | Truth 5 |

All six IDs from the phase request appear in the PLAN frontmatter and in ROADMAP.md line 132, and are `[x]` / Complete in REQUIREMENTS.md (lines 27-31 and 69; traceability lines 130-134 and 157). No other ID in REQUIREMENTS.md maps to Phase 14, so there are no orphaned requirements.

### Prohibitions (must_haves.prohibitions)

All plan prohibitions are `verification: judgment`, `status: resolved`; none is test-tier. These verdicts are my non-authoritative judgment, checked against the code at HEAD:

| Prohibition | Judgment |
|-------------|----------|
| Do not weaken the global focus ring (14-01) | Held: `app/globals.css` has no diff since `c3a06b3`; the fix is a scoped class on the panel links |
| Do not make the menu modal (14-01) | Held: no focus trap and no scroll lock in `SiteNav.tsx`; the new Escape test depends on the page staying scrollable while the menu is open |
| No `overflow-x: hidden` on html, body or main (14-02) | Held: `git grep overflow-x -- app components` is empty |
| Do not change the scrim's width, element or position (14-02) | Held: `w-56`, asserted `offsetWidth === 224` |
| Do not set `history.scrollRestoration` (14-03) | Held: only a comment mentions it |
| Do not clear `expandedId` from an effect on the labels preference (14-04) | Held: cleared in `setLabels` only |
| No terminal interactions beyond Previous and Next (14-05) | Held: no key handler in `DemoTerminal` |
| Do not reformat captured output (14-06) | Held: `command.output` rendered raw in `<samp>` |
| Ledger write-back is append-only (14-07) | Held for rows 6 and 30 (as checked in the previous report; those files are unchanged) |
| Tim alone commits the PNGs; no push without approval (14-08) | PNGs landed in `55160a4` authored by `tlex-web`; approval is recorded in the SUMMARY, which I did not re-verify |

### Anti-Patterns Found

No `TBD`, `FIXME` or `XXX` markers in any covered source file (git grep over the seven source files returned nothing). No stubs: every artifact is substantive and wired. The quick task's diff adds no empty handler or console-only code.

### Human Verification Required

None open. The one item from the previous report, Tim's 12-UAT test 3 keyboard re-check, is recorded in `14-UAT.md` (status `complete`, 1/1 pass, 0 issues, updated 2026-11-14T16:03:36Z). It was run at Tim's request on `next dev` in Edge and Firefox, keyboard only, via a Playwright script: 20/20 checks. The lightbox focus-return checks at 1366x650, 1280x560 and 720x450, the menu ring checks at 375x812 on /photos and /roadmap, and the touch-tap on the current link at scrollY 600 all passed, with scroll, URL and document unchanged. The UAT evidence is automated keyboard driving of real browsers, not Tim's hands, but Tim recorded the result as `pass`, so no human item remains. The UAT predates the quick task, but it exercised the tap close, not Escape. The quick task's Escape change is covered by its own e2e row and by the unchanged Escape-closes-to-the-button assertions.

### Findings classified

- **BLOCKER:** none.
- **WARNING:** none.
- **Info (not blocking):**
  - The three review fixes (`b8f3b1f`, `ea7d7f2`, `050b15b`) and the quick task commits are local and unpushed, so CI has not run on them. The phase PR will confirm. The Escape scroll row ran locally in Chromium and Firefox only; WebKit will first see it in CI.
  - 6 review info items (IN-01 to IN-06) are deferred to Phase 15 by Tim's choice, recorded in `14-REVIEW-DISPOSITION.md`.
  - `14-DOM-VERIFY.md` has no live-DOM look for any wave; the e2e rows and the UAT script stand in for it.
  - The LBOX-08 matrix runs three engines for one row only (Map 720x450 with Escape); the other 13 rows run in Chromium. This follows the plan (D-11).

### Deferred Items

None.

### Gaps Summary

No gaps. All five success criteria are met by code read at HEAD `fc17c97`. The quick task's change to `SiteNav.tsx` is a minimal `preventScroll` fix that matches the tap path and does not affect SHELL-07 or SHELL-08. No human verification items remain.

---

_Verified: 2026-11-14_
_Verifier: Claude (gsd-verifier)_
