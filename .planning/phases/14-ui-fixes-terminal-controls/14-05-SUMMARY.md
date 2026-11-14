---
phase: 14-ui-fixes-terminal-controls
plan: 05
subsystem: ui
tags: [react, terminal, a11y, aria-disabled, playwright, jest]
status: complete

requires:
  - phase: 14-04
    provides: the serial plan chain (Phase 14 runs one plan at a time on the local branch)
provides:
  - "stepTo(index, dir, count) in lib/demo-terminal.ts: an end-stopping step, null at either end"
  - "Previous command / Next command buttons around the dots in the DemoTerminal 'Commands' group (14-UI-SPEC Contract 1)"
  - "show(target) in the island: a step or a dot press shows the command complete and presses the sticky Pause (D-02)"
affects: [14-06 transcript (same files), 14-08 CI and visual re-baseline]

actuals:
  tokens: 8659
  tasks: 2
  commits: 2

plan_head_before: feda76265620c15e155e599e33303fd099ef6dc8
plan_head_after: dfd2c23b4d9a6d269d013197f29935fbef6001e8

tech-stack:
  added: []
  patterns:
    - "Manual moves go through one show(target) function: null is an end press and does nothing; otherwise set state and the sticky Pause"
    - "aria-disabled end-stop buttons guard in the handler and in the pure step (stepTo returns null), so goTo never throws"
    - "Playwright: aria-disabled counts as disabled for click(), so end presses use click({ force: true }) plus Enter on the focused button"

key-files:
  created: []
  modified:
    - lib/demo-terminal.ts
    - lib/__tests__/demo-terminal.test.ts
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - e2e/case-study.spec.ts
    - .planning/phases/14-ui-fixes-terminal-controls/deferred-items.md

key-decisions:
  - "14-05: The locked Contract 1 classes ship as written. Desktop Chromium's thin scrollbar gutter leaves the bar 299 px at a 375 px window, so the dot row wraps there by the spec's own rule. The one-row e2e check runs as a phone (isMobile in Chromium), and a desktop row asserts the wrap rule. A one-token tightening is logged in deferred-items for Tim to decide."
  - "14-05: The D-26 icon row now counts the Pause icon plus one caret per step button, all inside buttons. It was rewritten in place, not deleted (GUARD-03)."

patterns-established:
  - "End-stop step controls: aria-disabled + focusable + handler guard + pure null step"

requirements-completed: [ENG-06]

coverage:
  - id: D1
    description: "stepTo steps one command forward and back and returns null at both ends (no wrap, no RangeError)"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "lib/__tests__/demo-terminal.test.ts#steps one command forward and back, complete (ENG-06, D-03)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/demo-terminal.test.ts#stops at the ends instead of wrapping (ENG-06, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Previous and Next show the neighbouring command complete and press the sticky Pause; leaving does not resume"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#DemoTerminal step buttons (ENG-06, D-01 to D-03)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Next command steps one command and presses Pause (ENG-06, D-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The ends are aria-disabled, stay focusable, and a press (click or Enter) changes neither data-command nor aria-pressed"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#Previous is aria-disabled on command 1 and a press changes nothing and presses nothing (D-03)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#the step buttons stop at the ends (ENG-06, D-03)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A dot press, including the current dot, presses the sticky Pause; only releasing Pause resumes, with one timer pending"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#a dot shows its command complete at once, presses Pause and runs one timer (D-02)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#a dot shows its command complete with its note line and presses Pause (D-02, D-26)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tab order is Pause, Previous, dot 1 to n, Next; moving between them is not a focus entry"
    requirement: ENG-06
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#Tabs from Pause through Previous, every dot, then Next (DOM = visual = Tab order)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Tab from the toggle to Previous after a release keeps playing (D-02 amended, ENG-06)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Contract 1 bar layout: one 48 px row at 375 px on a phone; only the dot row wraps, with Previous and Next centred beside it; no sideways scroll"
    requirement: ENG-06
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#at 375 px on a phone > at 375 px the command bar is one 48 px row (ENG-06)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#at 375 px Previous and Next stay centred beside the dots and nothing scrolls sideways (ENG-06, G3)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#gives seven commands seven dots in a wrapping dot row, with Previous and Next beside it (ENG-06)"
        status: pass
    human_judgment: true
    rationale: "Desktop Chromium at a 375 px window wraps the bar to two rows (scrollbar gutter). Tim decides whether that is acceptable (deferred-items options a to d) before the 14-08 baseline."

duration: 15 min
completed: 2026-11-14
---

# Phase 14 Plan 05: Terminal step controls Summary

**The box demo terminal gets Previous and Next command buttons around its dots. Every step or dot press shows that command complete and holds the demo on the sticky Pause. The ends are aria-disabled and never wrap, and autoplay still loops.**

## Performance

- **Duration:** about 15 min (11:51 to 12:06 UTC)
- **Tasks:** 2 of 2
- **Files modified:** 5 source and test files, plus deferred-items.md

## Accomplishments

- `stepTo(index, dir, count)` in the pure, import-free state machine. It returns `goTo(index + dir)` inside `[0, count)` and `null` outside, so it never wraps and never reaches `goTo`'s RangeError (T-14-06).
- `STEP` (the CarouselControls `STEP_BUTTON` string, copied verbatim) and `show(target)` in the island. Previous and Next guard the end in their handlers and call `show(stepTo(...))`. The dots call `show(goTo(i, count))`.
- The bar is exactly `flex min-h-12 items-center gap-2 border-t border-line px-4`, holding Previous, a plain `flex min-w-0 flex-wrap items-center gap-2` dot row and Next. The `count >= 7` switch is retired. The island JSDoc now describes `[‹] dots [›]`, D-02, D-03 and G3.
- No arrow keys, no typing replay and no new live region (the plan's prohibition holds).

## Task Commits

1. **Task 1: Next command, stepTo, sticky Pause and the tracer browser row:** `be9a83e` (feat)
2. **Task 2: Previous, dots that press Pause, the Contract 1 bar and the rewritten rows:** `dfd2c23` (feat)

## Rewritten rows (GUARD-03: rewritten in place, none deleted)

| File | Old title | New title |
|------|-----------|-----------|
| DemoTerminal.test.tsx | keeps playing after a release when Tab moves from the toggle to a dot inside | keeps playing after a release when Tab moves from the toggle to Previous inside (ENG-06) |
| DemoTerminal.test.tsx | shows the pressed command complete at once without touching the toggle, and runs one timer (describe "selector dots (D-03)") | a dot shows its command complete at once, presses Pause and runs one timer (D-02) (describe "selector dots (11 D-03, 14 D-02)") |
| DemoTerminal.test.tsx | keeps observing the region in the document after the list shrinks, ... (WR-02) | unchanged title; it now releases Pause right after the dot press (`aria-pressed="false"`), and its comment explains why |
| DemoTerminal.test.tsx | gives seven commands seven dots in a wrapping bar | gives seven commands seven dots in a wrapping dot row, with Previous and Next beside it (ENG-06) |
| DemoTerminal.test.tsx | is static with one command: no toggle, no dots, no counter, no timer | is static with one command: no toggle, no step buttons, no dots, no counter, no timer |
| DemoTerminal.test.tsx | names the region and the title bar after the project, with no Request label | unchanged title; the icon check now expects the Pause icon plus one caret per step button, all inside buttons (it used to expect exactly 1 svg) |
| case-study.spec.ts | Tab from the toggle to a dot after a release keeps playing (D-02 amended) | Tab from the toggle to Previous after a release keeps playing (D-02 amended, ENG-06) |
| case-study.spec.ts | a dot shows its command complete with its note line, without touching the toggle (D-03, D-26) | a dot shows its command complete with its note line and presses Pause (D-02, D-26) |

New rows. Jest: 2 for `stepTo`, and 5 in "DemoTerminal step buttons (ENG-06, D-01 to D-03)" (Next step, Next end, Previous end, Previous step, full Tab order). Playwright: Next step, the ends, the 375 px phone one-row row, and the 375 px desktop wrap and no-scroll row.

The re-scan of every `Go to command` use found the 11 IN-01 shrink row, the screen-reader row and the focus row as planned (all unchanged). It found no other row that assumed "a dot press does not pause". The extra rewrite was the D-26 icon count, which the plan did not list.

**Jest counts:** DemoTerminal.test.tsx went from 29 at HEAD to 34. demo-terminal.test.ts went from 21 to 23. Both files together went from 50 to 57.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The D-26 icon row assumed the Pause icon was the only svg**
- **Found during:** Task 1 (first Jest run)
- **Issue:** `expect(region().querySelectorAll('svg')).toHaveLength(1)` fails once the carets exist.
- **Fix:** it now expects `1 + step buttons` svgs, each inside a button. That keeps its intent (no warning icon line). Rewritten, not deleted.
- **Files modified:** components/projects/__tests__/DemoTerminal.test.tsx
- **Commit:** be9a83e

**2. [Rule 1 - Bug] Playwright refuses to click an aria-disabled button**
- **Found during:** Task 2 (full e2e run)
- **Issue:** Playwright's actionability check treats `aria-disabled="true"` as not enabled, so `previous.click()` timed out.
- **Fix:** the ends row presses each end twice: once with `click({ force: true })` and once with Enter on the explicitly focused button. This also proves the button stays focusable, and it does not rely on click-to-focus, which WebKit lacks.
- **Files modified:** e2e/case-study.spec.ts
- **Commit:** dfd2c23

**3. [Rule 1 - Bug] The 375 px one-row truth does not hold in desktop Chromium**
- **Found during:** Task 2 (the bar measured 97 px in Chromium, 48 px in Firefox)
- **Issue:** `html { scrollbar-gutter: stable; scrollbar-width: thin }` reserves 10 px in desktop Chromium at a 375 px window. The frame is 333 px and the bar has 299 px inside, while the UI-SPEC measured 343 and 311. The 304 px cluster wraps the dots 3 + 1.
- **Fix:** I did not change the locked classes. The one-row row runs as a phone (`isMobile` in Chromium, where scrollbars overlay; Firefox does not support `isMobile` and has no gutter here). A desktop 375 px row asserts the spec's wrap rule: Previous and Next are 44 px and centred on the bar, and nothing scrolls sideways in the bar or the page. The fixture callback is named `provide` because react-hooks/rules-of-hooks flags a parameter named `use`.
- **Files modified:** e2e/case-study.spec.ts, deferred-items.md (options a to d for Tim)
- **Commit:** dfd2c23

---

**Total deviations:** 3 auto-fixed (3 bugs). **Impact:** the production code matches 14-UI-SPEC Contract 1 class for class. The only open question is the design choice for desktop Chromium at a 375 px window, and it is logged for Tim.

## Issues Encountered

- Each `PW_PROD` build injects a hash into `public/service-worker.js`. I restored it with `git checkout` after every build and never committed it.
- I started `npm run start` twice for `PW_REUSE` runs (a measurement spec and the phone-row re-check) and stopped it by port each time. The throwaway measurement spec `e2e/zz-debug/` was deleted and never committed. No server is listening on :3000.

## Verification

- `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx`: 57 passed.
- `PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox -g "ENG-06"` (Task 1): 2 passed. The same run after Task 2: 10 passed.
- `PW_PROD=1 npx playwright test e2e/case-study.spec.ts e2e/case-study-page.spec.ts --project=chromium --project=firefox` on a fresh build: 118 passed. After that run, the only change was renaming the lint fixture parameter, and the phone row re-ran and passed in both engines.
- `npm run lint`: exit 0. `npm run type-check`: exit 0.
- Acceptance greps: `export function stepTo` 1; `stepTo` in the lib test 5; `aria-label="Next command"` 1; `aria-label="Previous command"` 1; `^import` in lib/demo-terminal.ts 0; `count >= 7` 0; `without touching the toggle` 0 in Jest and 0 in e2e; `Previous command` in e2e 4; the WR-02 title 1 (passing); `ENG-06` in e2e 6.
- WebKit runs these rows in CI in 14-08.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

Ready for 14-06 (the transcript, on the same files). Before the 14-08 Chromium 375 px case-study baseline, Tim should pick an option for the desktop-narrow bar wrap (deferred-items.md).

## Self-Check: PASSED

- All 5 modified source files exist. Commits `be9a83e` and `dfd2c23` are ancestors of HEAD. Both count lines were measured from the ledger (2 commits).
