---
phase: 14-ui-fixes-terminal-controls
plan: 06
subsystem: ui
tags: [react, details, disclosure, reduced-motion, ssr, playwright, jest]
status: complete

requires:
  - phase: 14-05
    provides: "the step controls, show() and the sticky Pause override in DemoTerminal (same island and test files)"
  - phase: 14-01
    provides: "the earlier edit to e2e/visual/routes.spec.ts this plan builds on"
provides:
  - "details[data-transcript] after the terminal region, in the island's server output (14-UI-SPEC Contract 2)"
  - "Mount-only reduced-motion open (D-06) and Pause on visitor open (D-07)"
  - "Box reduced visual shots wait for the open transcript; declared PNG set box/375-reduced, box/768-reduced, box/1440-reduced for 14-08"
affects: [14-08 CI and visual re-baseline]

actuals:
  tokens: 8926
  tasks: 2
  commits: 2

plan_head_before: 1b20deba13b45850c53da237f3409e904e499f3f
plan_head_after: e29dad08d66e593ca5854071f67914dc55aad89d

tech-stack:
  added: []
  patterns:
    - "Server-closed native details opened once by a mount-only effect that reads matchMedia directly (never the reactive hook, never an open prop)"
    - "onToggle on details: press Pause only when open && !sticky, so the automatic open changes no state and repeat toggle events are idempotent"

key-files:
  created: []
  modified:
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - e2e/case-study.spec.ts
    - e2e/visual/routes.spec.ts

key-decisions:
  - "14-06: The transcript summary now sits between the terminal and the next focusable element, so two Jest Tab rows were rewritten in place to pass through it (GUARD-03); no row was deleted."
  - "14-06: The box reduced visual shot waits for the open transcript before settle(), so settle's scroll pass covers the taller page."

patterns-established:
  - "Server-closed disclosure opened after hydration only for reduced motion, never stored"

requirements-completed: [ENG-06]

coverage:
  - id: D1
    description: "A server-rendered details[data-transcript] sits after the region, outside it, closed, and lists every command, its output exactly as captured and its note"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#is in the server HTML, closed, with every command, output and note (D-04, D-06)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#sits after the region, outside it, with one list item per command in order (D-04)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#keeps the leading and trailing blank lines and the swatch of the captured output (11 D-26)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#the transcript is closed, outside the terminal, and holds every command (ENG-06, D-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One command renders no transcript; zero commands render nothing"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#renders no transcript for one command and nothing for none (G2, 11 IN-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Under reduced motion the transcript opens once after hydration, below the paused terminal; without it, it stays closed; a later OS change does not toggle it"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#opens once after mount under reduced motion, with Pause already pressed (D-05, D-06)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#does not open on a later reduced-motion change: the open is mount-only (D-06)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#the transcript opens after hydration, below the paused terminal (ENG-06, D-05, D-06)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Opening the transcript presses the sticky Pause; closing it leaves Pause pressed"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#opening it presses the sticky Pause; closing it leaves Pause pressed (D-07)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#opening the transcript presses Pause, closing leaves it pressed (ENG-06, D-07)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Without JavaScript the transcript is in the HTML, closed (even under reduced motion), and opens natively"
    requirement: ENG-06
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Transcript without JavaScript (ENG-06) > the transcript is in the HTML, closed, and opens natively (D-04, D-06)"
        status: pass
    human_judgment: false
  - id: D6
    description: "At 375 px with the transcript open nothing scrolls sideways; the long pipeline and the hash wrap inside the frame; no max-height, no inner scroll"
    requirement: ENG-06
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#no horizontal scroll at 375 px with the transcript open (ENG-06)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Transcript look (frame, summary row, caret, list rhythm) in the box reduced-motion baselines"
    verification:
      - kind: other
        ref: "PW_PROD=1 npx playwright test --list --project=visual-dark -g \"box @\" (3 reduced shots listed)"
        status: pass
    human_judgment: true
    rationale: "The PNGs box/375-reduced, box/768-reduced and box/1440-reduced are produced in 14-08 CI and Tim reviews and commits them; the visual result needs a human eye."

duration: 9 min
completed: 2026-11-14
---

# Phase 14 Plan 06: Terminal transcript Summary

**The box demo terminal now has a server-rendered native `<details data-transcript>` below it. It lists every command, its output exactly as captured, and its note. It renders closed, opens once after hydration under reduced motion, opens natively without JavaScript, and a visitor opening it presses the sticky Pause.**

## Performance

- **Duration:** 9 min, measured from the recorded start after the read-first pass (12:08 to 12:17 UTC)
- **Tasks:** 2 of 2
- **Files modified:** 4

## Accomplishments

- The island returns a fragment: the region, unchanged, then (for two or more commands) the Contract 2 disclosure with the class strings as written. The summary reads "Transcript" and has `CaretDownIcon` 20, which rotates 180 degrees instantly. The list is an `<ol>` with one `<li>` per command. Each holds an aria-hidden, select-none `❯`, the command in `<code>`, the output in `pre > samp` and the note in Inter. There is no `open` prop and no aria-live.
- `transcriptRef` plus a mount-only effect (above the early `return null`, guarded by `if (transcriptRef.current)`) opens it when `matchMedia('(prefers-reduced-motion: reduce)')` matches.
- `onTranscriptToggle` calls `setOverride(true)` only when `open && !sticky`.
- The island JSDoc has a transcript paragraph citing D-04 to D-07 and 11 D-26.
- The box reduced visual shots wait for `details[data-transcript]` to be open, with a comment naming the declared re-baseline.

## Task Commits

1. **Task 1: server-rendered transcript (tracer):** `2ce401a` (feat)
2. **Task 2: reduced-motion open, Pause on open, no-JS, 375 px and visual wait:** `e29dad0` (feat)

Tracer gate: the mode is end-of-phase, the gate is not auto, and the verify is automated-only. The tracer verify was re-run and passed before expansion.

## Rewritten rows (GUARD-03: rewritten in place, none deleted)

| File | Old title | New title / change |
|------|-----------|--------------------|
| DemoTerminal.test.tsx | pauses again after a release when focus leaves the region and enters it from outside | Title unchanged. Shift+Tab from Outside now lands first on the transcript summary (asserted still playing), and a second Shift+Tab enters the region |
| DemoTerminal.test.tsx | Tabs from Pause through Previous, every dot, then Next (DOM = visual = Tab order) | ... then Next, then out to the transcript (DOM = visual = Tab order). Tab from Next goes to the summary, outside the region, then Outside |
| case-study.spec.ts | no horizontal scroll at 375 px | no horizontal scroll at 375 px with the transcript open (ENG-06). It opens the transcript first. It checks max-height none and no inner scroll, that the longest command's `code` and the hash's `pre` fit inside the frame, and that the `pre` has no overflow |

New rows. Jest: 7 in "DemoTerminal transcript (ENG-06, D-04 to D-07)". Playwright: the D-04 default row, the D-07 Pause row, the reduced-motion D-05/D-06 row and the describe "Transcript without JavaScript (ENG-06)".

**Counts:** DemoTerminal.test.tsx went from 34 to 42 passing. Together with demo-terminal.test.ts it went from 57 to 65. The case-study and case-study-page e2e suites went from 118 to 126.

## Decisions Made

- The no-JS describe also pins `reducedMotion: 'reduce'`. That proves the server HTML stays closed even when the preference is set, because only the client effect opens it.
- The visual wait sits before `settle()` rather than right before the screenshot. Both are "before toHaveScreenshot", but this way settle's scroll pass covers the page after the transcript expands.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two Jest Tab-order rows assumed focus leaves the terminal straight to "Outside"**
- **Found during:** Task 1 (first Jest run)
- **Issue:** the transcript summary is focusable and now sits between the region and the test's Outside button. Shift+Tab from Outside and Tab from Next both land on it.
- **Fix:** both rows step through the summary explicitly and assert it is outside the region. They were rewritten in place, not deleted. The plan did not list these rows.
- **Files modified:** components/projects/__tests__/DemoTerminal.test.tsx
- **Commit:** 2ce401a

---

**Total deviations:** 1 auto-fixed (1 bug in test assumptions). **Impact:** the production markup matches Contract 2 as written. The pending command-bar gap decision (14-05 deferred item) was not touched.

## Issues Encountered

- The Bash tool on Windows halved doubled backslashes in a heredoc, which broke one new test's string literals. I fixed it with the Edit tool before the first commit.
- I built once, re-injected the service-worker hash, and ran the e2e suites with `PW_PROD=1 PW_REUSE=1` against one `npm run start`. Afterwards I stopped it by port (PID tree killed; :3000 is free) and restored `public/service-worker.js` with `git checkout`. It was never committed.
- I did not run the box visual shots locally: the baselines are Linux CI PNGs and a local run would write stray snapshots. The reduced-motion e2e row asserts the same wait condition.

## Verification

- `npx jest components/projects/__tests__/DemoTerminal.test.tsx lib/__tests__/demo-terminal.test.ts`: 65 passed. Full Jest: 105 suites, 1795 tests passed.
- `PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox -g "D-04"` (Task 1, fresh build): 2 passed.
- `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/case-study.spec.ts e2e/case-study-page.spec.ts --project=chromium --project=firefox` on a fresh build of the final code: 126 passed. This covers the axe row and the filler scan with the transcript present.
- `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/audit.spec.ts --project=chromium -g "every sitemap page"`: 1 passed. There is no hydration mismatch or console error on /projects/box.
- `PW_PROD=1 npx playwright test --list --project=visual-dark -g "box @"`: lists box @375, @768 and @1440 reduced.
- `npm run lint`: exit 0. `npm run type-check`: exit 0.
- Acceptance greps: `data-transcript` in DemoTerminal.tsx 1; `renderToString` in the Jest file 3; `data-transcript` in case-study.spec.ts 2 or more; `prefers-reduced-motion: reduce` 1; `onToggle={onTranscriptToggle}` 1; `javaScriptEnabled: false` 1; `data-transcript` in routes.spec.ts 1.
- T-14-07: the output renders as React text inside `<samp>`, with no `dangerouslySetInnerHTML` (checked with git grep).
- WebKit runs these rows in CI in 14-08.

## Declared PNG set for 14-08

The case-study terminal is the cause: `box/375-reduced`, `box/768-reduced`, `box/1440-reduced`. They now show the step buttons in the command bar (14-05) and the open transcript.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

14-07 is next. Tim's pending choice on the desktop-narrow command-bar gap (deferred-items.md, from 14-05) is still open and untouched. The transcript sits below the terminal and does not depend on how many rows the bar takes.

## Self-Check: PASSED

- All 4 modified files exist. Commits `2ce401a` and `e29dad0` are ancestors of HEAD. The commit count of 2 was measured from the ledger.
