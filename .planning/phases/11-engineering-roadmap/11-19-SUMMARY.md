---
phase: 11-engineering-roadmap
plan: 19
subsystem: ui
tags: [accessibility, accessible-name, sr-only, playwright, jest, metrics, gap-closure]
gap_closure: true
gap_ids: [G-11-4]

requires:
  - phase: 11-engineering-roadmap
    provides: "the Metrics instrument panel (ENG-04) and the box baselines committed in 11-17"
provides:
  - "box Metrics source links named 'Source (Tools)', 'Source (Tests)' and 'Source (Binary)' through an sr-only suffix built from each tile's dt label"
  - "a permanent e2e guard proving the suffix takes no layout space at 375, 768 and 1440 px in chromium and firefox"
affects: [11-verification, visual-regression, 12-polish]

actuals:
  tokens: 2360
  tasks: 2
  commits: 2
plan_head_before: 4f5bdc1877006033d2b62df5c8ba57a93b7b271a
plan_head_after: d111885544d93fbfd61119b17a0379711768f9ce

tech-stack:
  added: []
  patterns:
    - "A link's sr-only suffix starts with a space (' ({label})'), so jsdom, Playwright and the browser accessibility tree compute the same name, even though an absolutely positioned child of an inline-flex link is blockified and padded in browser name computation"
    - "Invisibility proof: in one synchronous page.evaluate, measure rects and scroll sizes, remove the .sr-only nodes, then measure again and deep-compare"

key-files:
  created: []
  modified:
    - components/projects/sections/Metrics.tsx
    - components/projects/__tests__/Metrics.test.tsx
    - e2e/case-study.spec.ts

key-decisions:
  - "G-11-4 suffix is the tile's existing dt label in parentheses, in an sr-only span after the icon (FactSource pattern), with no new words; Tim's UAT reply 'yes change to a suffix on each link' approved a per-link suffix, not a specific wording"
  - "No visual re-baseline: the suffix is absolutely positioned and clipped to 1 x 1 px, so the box baselines are expected to pass unchanged; the CI Visual Regression job on the next push is the remaining definitive gate"

patterns-established:
  - "Distinguish repeated link texts with an sr-only parenthetical built from existing visible copy, never with an aria-label that hides the visible word"

requirements-completed: [ENG-04]

coverage:
  - id: D1
    description: "Each box Metrics source link is named after its tile: 'Source (Tools)', 'Source (Tests)', 'Source (Binary)', with the unchanged href and no target, and no bare 'Source' link in section#metrics"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#names every source link after its tile, so links to the same page are told apart (G-11-4)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#puts a Source link after the context of a tile with a sourceUrl, and none elsewhere (D-23)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Metrics tiles show the audited values with their context lines on /projects/box (ENG-04) [chromium, firefox]"
        status: pass
    human_judgment: false
  - id: D2
    description: "The suffix is screen-reader-only: at most 1 x 1 px, and removing it moves no dl, tile, dd or link and changes neither scroll size at 375, 768 and 1440 px"
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#box Metrics source suffixes are screen-reader-only: removing them moves nothing at 375, 768 and 1440 px (G-11-4) [chromium, firefox]"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 293b093 --none / --sha d111885 --none (snapshot-commit: OK (0 changed))"
        status: pass
    human_judgment: false
  - id: D3
    description: "coin-flip tiles stay link-free and suffix-free (D-23)"
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Metrics tiles show the audited values with their context lines on /projects/coin-flip (ENG-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A screen reader announces the three links distinctly in a links list or rotor"
    verification: []
    human_judgment: true
    rationale: "The accessible names are proven in jsdom and Playwright's accessibility snapshot; an actual screen-reader pass (NVDA, VoiceOver) is a human check if Tim wants one"

duration: 9min
completed: 2026-11-02
status: complete
---

# Phase 11 Plan 19: Per-tile Metrics source link names (G-11-4) Summary

**The three box Metrics "Source" links are now named "Source (Tools)", "Source (Tests)" and "Source (Binary)" through an sr-only ' ({tile label})' suffix. A new two-engine e2e proves the suffix moves no pixel at the three visual-baseline widths.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-02T11:15:39Z
- **Completed:** 2026-11-02T11:24Z
- **Tasks:** 2 of 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 3

## Final link names (live /projects/box, chromium and firefox)

| Tile | Accessible name | href |
|------|-----------------|------|
| Tools | `Source (Tools)` | `https://github.com/tlex-web/box#readme` |
| Tests | `Source (Tests)` | `https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md` |
| Binary | `Source (Binary)` | `https://github.com/tlex-web/box#readme` |

No link in section#metrics is named the bare "Source". None has a target. coin-flip has no link and no suffix (D-23).

## Wording and approval

Tim's UAT reply (11-UAT.md test 4), quoted verbatim:

> yes change to a suffix on each link

That reply approved a suffix on each link. It did not approve a specific wording. The suffix adds no new words. It is the tile's own dt label (Tools, Tests, Binary), which is existing copy (D-09), wrapped in the parentheses that FactSource in `components/photos/Hotspots.tsx` already uses for an sr-only link suffix. Because the name starts with the visible word "Source", WCAG 2.5.3 Label in Name still holds.

## Accomplishments

- `Metrics.tsx`: one `<span className="sr-only"> ({tile.label})</span>` after the aria-hidden `ArrowSquareOutIcon`. The visible word, the icon, every anchor class and the href are byte-for-byte unchanged. Two JSDoc sentences explain the suffix and why it starts with a space.
- Unit tests: the D-23 test now asserts the name `Source (Label 1)`, the full dd textContent, the unchanged on-screen text (the dd cloned without `.sr-only`), exactly one `.sr-only` element in the link with text ` (Label 1)`, and no `.sr-only` element in the unsourced tile. A new G-11-4 test checks three links, two sharing a URL, and finds no bare "Source" link.
- e2e: the Metrics test expects `{context} Source ({label})` and looks up each link by `Source ({label})` (exact). It asserts no bare "Source" link and one link per sourced tile, all built from the data. A new test proves the suffix is invisible at 375, 768 and 1440 px.

## TDD (Task 1, tdd="true")

- **RED:** With the tests updated and `Metrics.tsx` untouched, `npx jest components/projects/__tests__/Metrics.test.tsx` had 2 of 14 failing, both on the planned assertion: `TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Source (Label 1)"`. Semantic assessment: both target tests ran and failed for the intended reason, because the link was still named "Source". There were no load, syntax or fixture faults and the other 12 tests passed. The `check tdd-red-evidence` classifier was not run, because Jest's default reporter is not one of its supported formats and this is a `type: execute` plan. This assessment is the record.
- **GREEN:** After the sr-only span was added, 14 of 14 passed.
- **REFACTOR:** None needed.
- The plan specifies one commit per task, so RED and GREEN share the Task 1 `fix(11-19)` commit. The RED run happened before the implementation, as shown above.

## Tracer gate

The run was interactive (`_auto_chain_active` false) with `human_verify_mode` end-of-phase, and the tracer's verify is automated only. The full Task 1 verify (Jest, type-check, eslint, sr-only count = 1, chromium Metrics e2e 2/2) passed on the committed code, so Task 2 went ahead with no checkpoint.

## Task Commits

1. **Task 1 (tracer): each box Source link is named after its tile.** `293b093` (fix)
2. **Task 2: prove the suffix is invisible at the three baseline widths.** `d111885` (test)

**Plan metadata:** the docs(11-19) commit that adds this SUMMARY.

## check-snapshot-commit output

```
$ node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none      # d111885
snapshot-commit: OK (0 changed)
$ node scripts/ci/check-snapshot-commit.mjs --sha HEAD~1 --none    # 293b093
snapshot-commit: OK (0 changed)
```

`git diff --name-only 4f5bdc1..d111885 -- e2e/visual` and `-- '*.png'` are both empty.

## Visual-baseline evidence and reasoning

- **Measured:** The new e2e passes at 375, 768 and 1440 px (height 900) in chromium and firefox. Each suffix box is at most 1 x 1 px. With every suffix removed, the dl, tile, dd and link rects (13 rects: 1 dl, 3 tiles, 6 dds, 3 links) are deep-equal to their positions before removal, and `scrollWidth`/`scrollHeight` are unchanged.
- **Negative controls:** These were run locally and then reverted with `git checkout -- Metrics.tsx`, so neither was committed. Renaming the class away failed the test on the suffix count (expected 3, received 0). `sr-only not-sr-only` failed it on geometry (suffix width 45.73 px at 375 px). The guard is not vacuous.
- **Reasoning:** Tailwind's `sr-only` is `position: absolute`, so the span is not a flex item of the inline-flex link and takes no `gap-1`. It is clipped to a 1 x 1 px box with a -1 px margin, so it paints nothing visible. FactSource already ships the same construction.
- **Conclusion:** `box/{375,768,1440}-reduced-visual-dark-linux.png` are expected to pass unchanged, so no re-baseline is needed. No "Update visual baselines" run was dispatched and nothing was pushed.
- **Remaining definitive gate:** the CI **Visual Regression** job on the next push of this branch or its PR. Under the e2e/visual/README.md zero-diff rule, any box diff there is a code defect to fix, never a re-baseline.

## Test counts

- `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: `test-count: jest 1307 + e2e 462 = 1769 (baseline 1749)`, `test-count: OK`
- This plan adds exactly +1 Jest and +1 e2e and deletes no test. The plan's estimate of 1290/461 used 11-17's counts (1289/460). Four commits after the 11-17 ratchet and before this plan (`e328587` Nyquist tests, `e41cb46` secure-phase, `541042b` WR-01, `5aef73d` WR-02) had already raised the base to 1306/461.
- The baseline file was not raised (`--update` not run). jest-results.json is gitignored.

## Verification run

- `npx jest components/projects data/__tests__/projects.test.ts --silent`: 12 suites, 203 tests passed
- `npx jest` (full): 82 suites, 1307 tests passed
- `npm run lint`: exit 0 (every guard OK; the warnings are pre-existing React Compiler warnings in legacy files, and none is in this plan's files)
- `npm run type-check`: clean
- `npx playwright test e2e/case-study.spec.ts e2e/case-study-page.spec.ts --project=chromium --project=firefox` (dev server): 110 passed, covering axe wcag2a/wcag2aa, the filler scan and the 375 px no-sideways-scroll test. The first run had 1 failure in an untouched test (see Issues Encountered), and the re-run passed 110/110.
- Port 3000 was free before and after. Playwright started and stopped its own dev server, and no server was left running.

## Files Created/Modified

- `components/projects/sections/Metrics.tsx`: sr-only suffix and JSDoc
- `components/projects/__tests__/Metrics.test.tsx`: rewritten D-23 test, new G-11-4 test, header sentence
- `e2e/case-study.spec.ts`: per-tile names in the Metrics e2e, new invisibility test

## Decisions Made

- Used the sr-only span (FactSource) instead of `aria-label`, because the visible word stays part of the computed name and the leading space removes the spacing difference that made TrailSigns and EndBlock use `aria-label`.
- Did not dispatch a re-baseline. The invisibility proof and the 0-changed snapshot checks are recorded here, and CI Visual Regression stays the final gate.

## Deviations from Plan

None in the shipped code. The plan was executed as written. One process note: Task 1's RED run is recorded in this SUMMARY rather than in a separate `test(...)` commit, because the plan specifies one commit per task.

## Issues Encountered

- On the first two-engine e2e run, `Demo (ENG-05) › Pause is sticky: nothing advances until it is pressed again (D-02)` failed once on chromium: after resume, `data-command` was still "1" at the 8 s timeout. It passed 4/4 alone (`--repeat-each=4`) and 110/110 on the immediate full re-run. It is a timing flake under parallel dev-server load, in the box Demo terminal, which this plan does not touch. It is out of scope, so no assertion was changed, and it is logged in `.planning/phases/11-engineering-roadmap/deferred-items.md`. CI runs a production build with one worker.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- G-11-4 is closed in code. Phase 11 can be re-verified. The CI Visual Regression job on the next push of this branch (or its PR) is the remaining definitive gate for the box baselines. Pushing to a ci/11-19 branch is Tim's call, since no standing approval covers it.
- Both task commits stay on the local phase branch (not pushed).

## Self-Check: PASSED

- Files found: components/projects/sections/Metrics.tsx, components/projects/__tests__/Metrics.test.tsx, e2e/case-study.spec.ts
- Commits found on HEAD: 293b093, d111885
- `commits: 2` measured as `git rev-list --count 4f5bdc1..d111885` (the SUMMARY commit comes after it)

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-02*
