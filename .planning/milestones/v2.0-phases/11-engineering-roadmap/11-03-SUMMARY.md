---
phase: 11-engineering-roadmap
plan: 03
subsystem: ui
tags: [react, client-island, a11y, wai-carousel, jest, playwright, terminal]

requires:
  - phase: 11-engineering-roadmap
    provides: "11-01 DemoTerminal island, pure state machine and case-study e2e harness; 11-02 Tim's answers (D-02 option B, §I #8 and #11 defaults)"
provides:
  - "lib/demo-terminal.ts releaseSticky(p) (sticky, hover, focusWithin false; offscreen and hidden kept) and TerminalCommand.note?"
  - "DemoTerminal({ name, commands }): region '{name} demo', title '{name}', no data-module import"
  - "Release resumes at once; hover and focus pauses re-arm only on the next entry; focus between the region's own controls is not an entry"
  - "Body lines: prompt + command line, output, optional <p data-note> (D-26); Request, warning and explanation lines gone"
  - "e2e region lookups derived from data/projects, so 11-07 only changes route paths"
affects: [11-07 box data swap, 11-08 CaseStudy template, 11-14, visual re-baseline of the case study]

actuals:
  tokens: 7459    # chars/4 over every added and removed diff line (29,837 chars)
  tasks: 2
  commits: 3
plan_head_before: 9432fb4acedaf2f69de07ce3e9082d836c6a5ab2
plan_head_after: 9e2a24af85127db9463b890025745a90e4791b0d

tech-stack:
  added: []
  patterns:
    - "Release of a sticky pause applies a pure helper (releaseSticky) in one handler, so the rule is unit-tested without React"
    - "Entry-only focus pause: onFocus ignores a relatedTarget inside the region, mirroring onBlur"
    - "Height reservation also covers the current command while it types: an invisible complete copy sits in the same grid cell"

key-files:
  created: []
  modified:
    - lib/demo-terminal.ts
    - lib/__tests__/demo-terminal.test.ts
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - app/(site)/projects/[slug]/page.tsx
    - e2e/case-study.spec.ts
    - e2e/no-webgl.spec.ts
    - .planning/WINDOWS.md

key-decisions:
  - "§I #8 and #11 are the defaults (11-02, Reply 5 F): constant 'Pause' label with aria-pressed, no copy button; nothing extra built"
  - "The toggle handler calls releaseSticky on the current sources and applies its sticky, hover and focusWithin values, so the island and the unit-tested rule cannot drift"
  - "While the current command types, an invisible complete copy of it holds the body height (Rule 1 fix of an 11-01 gap; the note line made it visible)"
  - "The note is spoken through sentence(), so a note without a full stop still ends the sr-only text cleanly"

patterns-established:
  - "e2e on the terminal: leaveTerminal() after a Pause press or a dot press, never after a release"
  - "Component tests find the note through [data-note], never a class"

requirements-completed: []  # plan declares [ENG-05]; requirements.ready-ids blocks it until the last Phase 11 plan declaring ENG-05 has a SUMMARY

coverage:
  - id: D1
    description: "releaseSticky: release drops sticky, hover and focusWithin; offscreen and hidden survive and keep autoplay paused"
    requirement: ENG-05
    verification:
      - kind: unit
        ref: "lib/__tests__/demo-terminal.test.ts#releases the sticky Pause together with the hover and focus pauses (D-02 amended); keeps %s through a release"
        status: pass
    human_judgment: false
  - id: D2
    description: "Releasing Pause resumes at once with pointer and focus still inside; leaving and re-entering, or focus entering from outside, pauses again; Tab toggle -> dot keeps playing; offscreen and hidden still hold; reduced-motion release resumes"
    requirement: ENG-05
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#DemoTerminal sticky Pause and its release (D-02 amended) (7 tests) and reduced motion"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#releasing Pause resumes at once / after a release, leaving and re-entering pauses again / Tab from the toggle to a dot after a release keeps playing (chromium + firefox, production build)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Project-named region and title, note line under the output (once, data-note), no note element without one, no Request label or warning icon, sr-only text 'Command n of t. Command: … Output: ….' plus the note"
    requirement: ENG-05
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#DemoTerminal lines (D-26) and screen-reader text"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#a dot shows its command complete without touching the toggle, and a command without a note has no note line (D-03, D-26); e2e/no-webgl.spec.ts#project detail keeps its content"
        status: pass
    human_judgment: false
  - id: D4
    description: "The retargeted body (prompt line, muted output, Inter note) reads well against the UI-SPEC at 375 and 1440"
    requirement: ENG-05
    verification: []
    human_judgment: true
    rationale: "Visual quality is judged at the phase visual re-baseline once 11-07 swaps in box data; only Tim commits PNGs"

duration: 8min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 03: Terminal Release Rule, Note Line and Project-Named Region Summary

**Releasing the demo terminal's Pause toggle now resumes playback at once. A new pure `releaseSticky` clears the sticky, hover and focus pauses together and keeps the offscreen and hidden-tab pauses. Focus pauses the terminal only when it enters the region from outside. The body draws the command line, the output and an optional `data-note` line in place of the CLI_X request, warning and explanation lines. The island takes only `name` and `commands`, so 11-07 can pass box's commands without changing it.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-01T20:23:31Z
- **Completed:** 2026-11-01T20:31:39Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `lib/demo-terminal.ts`: `releaseSticky(p)` (D-02 amended) and `TerminalCommand.note?` (D-26). The header and phase docs now describe box (input = command line, output = captured output), and the file is still import-free.
- `components/projects/DemoTerminal.tsx`: the props are `{ name, commands }` and the island has no `@/data/types` or `WarningIcon` import (T-11-07). The region is named `{name} demo` and the title bar reads `{name}`. The toggle handler applies `releaseSticky` when the toggle is pressed and sets `override` to true when it is not. `onFocus` returns early when `relatedTarget` is inside the region. The lines are `❯` plus the command line (`text-ink`, `whitespace-pre-wrap wrap-anywhere`), the output (`mt-1 text-ink-muted whitespace-pre-wrap wrap-anywhere`), and the note once the command is complete (`<p data-note class="mt-2 font-sans text-sm text-ink">`). The sr-only text reads `Command n of t. Command: …. Output: ….`, followed by the note when there is one.
- `app/(site)/projects/[slug]/page.tsx`: passes `name={project.name}` and is still a Server Component.
- §I #8 and #11: Tim chose the defaults (11-02 `default.8`, `default.11`), so the constant `Pause` label with `aria-pressed` stays and there is no copy button. Nothing extra was built.
- WINDOWS row 5 (the D-04 badge stub) is waived: "void: D-04 retired by D-24; the D-26 note line replaces the badge (11-03)".
- **Tests added:** Jest +13. The lib suite went from 17 to 20 tests (2 new calls, one an `it.each` over offscreen and hidden). The component suite went from 13 to 23: 7 release tests, 3 line tests, and the reduced-motion and sr-only tests rewritten. The e2e suite has +3 tests per browser (14 in `case-study.spec.ts`), and the 11-01 dot test was rewritten. The acceptance grep counts 36 test calls (baseline 24 by that regex; the plan's "30" counts `it.each` expansions). Ratchet: jest 1108 + e2e 380 = 1488 (baseline 1300).

## Task Commits

1. **Task 1 RED: failing tests for the D-02 release rule and the note line**: `83db0f2` (test)
2. **Task 1 GREEN: terminal release resumes at once, note line and project-named region**: `6d691cc` (feat)
3. **Task 2: e2e for the D-02 release rule and the note line**: `9e2a24a` (test)

No refactor commit was needed.

## TDD Gate Compliance (Task 1)

- **RED (`83db0f2`):** 25 of 43 tests failed. The 3 lib cases failed with `releaseSticky is not a function`, the planned missing export. All 22 component tests failed on the new region-name contract (`Unable to find … region … "box demo"`). That is a planned assertion, not an import, syntax or fixture fault. **Semantic assessment:** valid RED for the lib rule and the name/props contract. Because the region lookup fails first, the RED run alone does not show that the release and focus-entry tests catch the old behaviour. GREEN therefore added a mutation check: restoring the old `onClick={() => setOverride(!sticky)}` failed 5 tests (the release, re-entry, focus re-entry, Tab-to-dot and reduced-motion release tests), and restoring the old unconditional `onFocus` failed the Tab-to-dot test. The file was restored after each run.
- **GREEN (`6d691cc`):** 43/43. The `tdd-red-evidence` classifier was not run: `workflow.tdd_mode` is off, the plan is `type: execute`, and Jest output is not one of the classifier's formats.

## Files Created/Modified

- `lib/demo-terminal.ts`: `releaseSticky`, `note?`, box wording
- `lib/__tests__/demo-terminal.test.ts`: release cases
- `components/projects/DemoTerminal.tsx`: name prop, entry-only focus, releasing toggle, new lines, typing-height copy
- `components/projects/__tests__/DemoTerminal.test.tsx`: box-style `TerminalCommand[]` fixtures (one with the note 'BLAKE3 is the default hash.'), rendered with `name="box"`
- `app/(site)/projects/[slug]/page.tsx`: `name={project.name}`
- `e2e/case-study.spec.ts`: `demoProject`, `regionName`, `LAST_N` from the data; three release tests; dot test rewritten
- `e2e/no-webgl.spec.ts`: region name from the data
- `.planning/WINDOWS.md`: row 5 waived

## Decisions Made

- The handler calls `releaseSticky` on the live sources and applies its result, so the island cannot drift from the unit-tested rule (key link `releaseSticky`).
- The note goes through `sentence()` like the other fragments, so the spoken text always ends with a full stop.
- In the sticky e2e test, `leaveTerminal()` no longer follows the release click. The test now proves that the release alone resumes playback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The body shrank while the tallest command typed**
- **Found during:** Task 1 GREEN
- **Issue:** 11-01 reserves height with the non-current commands rendered invisible in the same cell. The current command, however, shows only its typed part. When the current command is the tallest, for example after a wrap back to command 1, the body shrank while it typed and grew again at the end. The new note line, which appears only once the command is complete, adds height at that moment. This broke the truth "the body is as tall as the tallest command and nothing below moves (CLS 0)".
- **Fix:** While the current command is not complete, an invisible, `aria-hidden` complete copy of it (note included) sits in the same grid cell. It is a sibling of the `data-cell` element, so the cell's text assertions are unchanged.
- **Files modified:** components/projects/DemoTerminal.tsx
- **Verification:** 43/43 Jest. The e2e 375 px no-horizontal-scroll test passes.
- **Committed in:** 6d691cc

**2. [Rule 1 - Acceptance] The dot e2e asserts through `data-cell`, not `region.getByText`**
- **Found during:** Task 2
- **Issue:** The region's text includes every invisible cell, so "the region contains that command's output text" would always pass.
- **Fix:** The test asserts that the `[data-cell="{n}"]` cell is visible and contains the output. It also checks `aria-current`, that `aria-pressed` is unchanged, and that `[data-note]` has count 0, and then that `leaveTerminal()` resumes playback.
- **Committed in:** 9e2a24a

---

**Total deviations:** 2 auto-fixed (Rule 1)
**Impact on plan:** Both protect stated truths (CLS 0 and a meaningful dot assertion). No scope creep.

## Issues Encountered

- A heredoc with nested quotes failed in the shell. The edits were applied from Python scripts in the scratchpad instead (not committed).
- Production-build e2e runs rewrote `public/service-worker.js`. It was restored with `git restore` after each run and never staged.

## Verification

- `npm run lint`: exit 0. There are 11 warnings, all in pre-existing legacy files, and the touched files lint clean. `npm run type-check`: clean.
- `npx jest`: 1108/1108 (71 suites). `guard:tests`: OK (1488 vs 1300).
- `PW_PROD=1 npx playwright test e2e/case-study.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox`: 36/36. With `e2e/shell.spec.ts` on chromium: 51/51.
- Task 1 acceptance: `releaseSticky` 1; `data/types` 0; `WarningIcon` 0; `name={project.name}` 1; the `clix|cli_x|cli-x` git grep prints nothing (exit 1); 36 test calls (needed at least 34). Task 2 acceptance: `--list` shows all four titles, and `'CLI_X demo'` appears 0 times in both specs. No `.only(`, `.skip(` or `.fixme(`.

## Known Stubs

None added. WINDOWS row 4 (the Demo intro copy, 11-09) is still open and is not in this plan's scope.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **For 11-07:** `DemoTerminal` needs `name` and `commands` (`readonly TerminalCommand[]`, each `{ input, output, note? }`). Pass box's approved commands and the island needs no changes. The e2e lookups are data-derived (`demoProject`, `regionName`, `LAST_N`), so only the route paths (`/projects/clix-cli`), the title test and the 404 slug list change. Once box data has notes, the dot test's "no `[data-note]`" line has to target a command without a note.
- **Visual:** the case-study terminal body changes: no Request label and no warning or explanation lines. The phase re-baseline covers it, and only Tim commits PNGs.

## Self-Check: PASSED

- Files: all 8 modified files exist. `.planning/phases/11-engineering-roadmap/11-03-SUMMARY.md` written.
- Commits: 83db0f2, 6d691cc and 9e2a24a are ancestors of HEAD (`git rev-list --count 9432fb4..HEAD` = 3).
- All acceptance criteria and the plan-level verification were re-run and pass (see Verification).

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
