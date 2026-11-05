---
phase: 11-engineering-roadmap
plan: 01
subsystem: ui
tags: [nextjs, react, server-components, client-island, a11y, playwright, jest, terminal]

requires:
  - phase: 08-data-terrain-pipeline
    provides: typed DemoCommand schema with real riskScores (data/schemas/project.ts)
  - phase: 10-photography
    provides: generateStaticParams + dynamicParams = false + generateMetadata route shape (/photos/[slug]); aria-pressed constant-label toggle precedent
provides:
  - lib/demo-terminal.ts pure state machine (initialState, tick, goTo, delayFor, isPlaying, visibleLines, TIMINGS, PauseSources)
  - components/projects/DemoTerminal.tsx flat token terminal island with sticky Pause, temporary pause sources, dots and sr-only live text
  - /projects/[slug] as a Server Component with dynamicParams = false, generateStaticParams and generateMetadata (SEO-02 hook)
  - e2e/case-study.spec.ts harness for case-study pages (title, exact-slug 404s, no three.js, Demo behaviour)
  - DOM contract on the region 'CLI_X demo': data-playback, data-command; dots grouped as role=group 'Commands'
affects: [11-03 risk badge, 11-08 CaseStudy template, 11-09 demo intro copy, 11-10 new demo commands, 11-12 hero and description, 12 SEO-02 OG images, visual re-baseline of clix-cli]

actuals:
  tokens: 18125    # chars/4 over every added and removed diff line (72,501 chars; 808 of the removed lines are the three deleted v1 files)
  tasks: 2
  commits: 3
plan_head_before: 911a0447d05be8d70762204146da9bba3bf00884
plan_head_after: 94cb20bd723387974f5bc90ba48a9ace99ebbf56

tech-stack:
  added: []
  patterns:
    - "Client island state machine: pure import-free lib module + one effect scheduling a single timeout of delayFor(state), cleared in cleanup"
    - "Pause sources as separate flags combined by isPlaying(); sticky = override ?? reduced"
    - "Height reservation: every item rendered in one grid cell (col-start-1 row-start-1), non-current invisible"
    - "Fake-timer component tests advance in 10 ms act() steps because the next timeout is scheduled from an effect"

key-files:
  created:
    - lib/demo-terminal.ts
    - lib/__tests__/demo-terminal.test.ts
    - components/projects/DemoTerminal.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - e2e/case-study.spec.ts
  modified:
    - app/(site)/projects/[slug]/page.tsx
    - e2e/no-webgl.spec.ts
    - eslint.config.mjs
  deleted:
    - components/ProjectDetailClient.tsx
    - components/HologramTerminal.tsx
    - components/HologramTerminalDemo.tsx

key-decisions:
  - "The drawn terminal lines are aria-hidden at all times, not only while typing; the sr-only block is the single screen-reader source, so a completed command is never read twice (satisfies the UI-SPEC truth 'typing lines are aria-hidden')"
  - "The dot bar is role=group named 'Commands' (grouping for screen readers and the G3 test hook)"
  - "Overview renders before Demo on the case study, following the ENG-02 order (problem before demo); the Overview markup moved verbatim from ProjectDetailClient"
  - "Visual cells hold the full text of every command; the current cell shows visibleLines() of the live state"

patterns-established:
  - "Case-study e2e: assert aria-pressed, data-playback, data-command, aria-current and text, never classes (G3 wrap uses the layout class flex-wrap only)"
  - "e2e on the terminal: scroll the region into view before expecting 'playing' (offscreen is a pause source), and move pointer and focus out after a click (hover and focus-within pause)"

requirements-completed: []  # plan declares [ENG-05, ENG-02]; both are shared with later Phase 11 plans, so requirements.ready-ids blocks marking them until the last declaring plan has a SUMMARY

coverage:
  - id: D1
    description: "/projects/[slug] is a Server Component with dynamicParams = false, generateStaticParams and generateMetadata; title 'CLI_X - AI Command Line Tool · Tim Lui'; unknown and wrong-case slugs are the designed 404"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Case-study route (title, /projects/no-such-slug, /projects/CLIX-CLI)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No three.js loads and no canvas renders on the case study, with or without WebGL (D-01)"
    requirement: ENG-05
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#loads no THREE.WebGLRenderer script and no canvas (D-01)"
        status: pass
      - kind: e2e
        ref: "e2e/no-webgl.spec.ts#project detail keeps its content"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sticky Pause toggle, hover / focus-within / offscreen / hidden-tab pauses, reduced-motion start, selector dots with a single pending timer, G2 and G3 layouts, sr-only text with aria-live off/polite"
    requirement: ENG-05
    verification:
      - kind: unit
        ref: "lib/__tests__/demo-terminal.test.ts (17 tests)"
        status: pass
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx (13 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Demo (ENG-05) and Demo under reduced motion (chromium + firefox, production build)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Flat token terminal reads well visually (spacing, title bar, dots, caret) against the UI-SPEC Demo section"
    requirement: ENG-05
    verification: []
    human_judgment: true
    rationale: "Visual quality is judged at the phase visual re-baseline; the clix-cli baseline changes and only Tim commits PNGs"

duration: 17min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 01: Flat DemoTerminal on the Server-Rendered Case-Study Route Summary

**`/projects/clix-cli` is now a Server Component with static params, exact-slug 404s and `generateMetadata`. Its CLI_X demo plays in a flat token terminal island that never loads three.js, runs one timer at a time, and pauses on hover, on focus inside it, when scrolled away, when the tab is hidden, or when the visitor presses Pause.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-01T15:07:47Z
- **Completed:** 2026-11-01T15:24:30Z
- **Tasks:** 2 (tracer + TDD expansion)
- **Files modified:** 11 (5 created, 3 modified, 3 deleted)

## Accomplishments

- `lib/demo-terminal.ts`: a pure state machine (`input → gap → output → shown`) with the v1 timings (50 / 500 / 10 / 3000 ms), a reduced-motion jump, `goTo` with a RangeError guard, `isPlaying` over five pause sources, and `visibleLines`.
- `components/projects/DemoTerminal.tsx`: a client island that receives only `demoCommands` props. One effect schedules a single timeout and clears it on cleanup, which fixes the v1 timer leak (Pitfall 1). The Pause toggle is sticky, has a constant label and `aria-pressed`, and starts pressed under reduced motion. Temporary pauses come from hover, focus inside, offscreen (IntersectionObserver) and a hidden tab (visibilitychange through `useSyncExternalStore`). The selector dots stay, with 44 px targets and `aria-current`. Every command shares one grid cell, so the layout never shifts. One command renders a static terminal (G2); seven or more wrap the dot bar (G3). The sr-only text is `aria-live` off while playing and polite while paused.
- `app/(site)/projects/[slug]/page.tsx`: `dynamicParams = false`, `generateStaticParams`, `generateMetadata` (`{ title: project.name }`, the Phase 12 OG hook), server-rendered Overview, and a `#demo` section that imports the island directly.
- The v1 R3F laptop and its wrappers are deleted, and `LEGACY_COMPILER_FILES` is down to 3 entries.
- Tests: Jest +30 (17 lib, 13 component). `e2e/case-study.spec.ts` has 11 tests per browser, and the no-WebGL project case was rewritten. Ratchet: jest 973 + e2e 376 = 1349 (baseline 1300).

## Task Commits

1. **Task 1 (tracer): flat DemoTerminal on the server-rendered case-study route**: `cf369b5` (feat)
2. **Task 2 RED: failing tests for terminal pause sources and dots**: `7eef6ba` (test)
3. **Task 2 GREEN: pause sources, dots, reduced motion and sr text**: `94cb20b` (feat)

No refactor commit was needed.

## TDD Gate Compliance (Task 2)

- **RED (`7eef6ba`):** 12 of 13 component tests failed on the planned assertions: no `data-cell`, no `Go to command` buttons, `data-playback` stayed `playing` under hover, offscreen and hidden, the G2 toggle was still present, no `Commands` group, and no sr-only text. None failed on an import, syntax or fixture fault. **Semantic assessment:** valid RED for the component behaviours. All 17 lib tests and the component unmount test already passed at RED. The plan has Task 1 build the whole lib, including `goTo` ("Add goTo now too"), together with the single-timer effect, so those tests pin existing behaviour rather than drive new code. The RED target was the component suite.
- **GREEN (`94cb20b`):** 30/30. The formal `tdd-red-evidence` classifier was not run: `workflow.tdd_mode` is not enabled, the plan is `type: execute`, and Jest output is not one of the classifier's formats.

## Files Created/Modified

- `lib/demo-terminal.ts`: pure, import-free terminal state machine
- `lib/__tests__/demo-terminal.test.ts`: walk, wrap, reduced jump, timings, goTo range, pause sources, visible lines
- `components/projects/DemoTerminal.tsx`: the client island
- `components/projects/__tests__/DemoTerminal.test.tsx`: every pause source, dots with one timer, reduced motion, G2/G3, sr text
- `e2e/case-study.spec.ts`: route contract and Demo behaviour
- `app/(site)/projects/[slug]/page.tsx`: Server Component route contract and the Demo section
- `e2e/no-webgl.spec.ts`: project case rewritten (Pitfall 4)
- `eslint.config.mjs`: two terminal entries removed from `LEGACY_COMPILER_FILES`
- Deleted: `components/ProjectDetailClient.tsx`, `components/HologramTerminal.tsx`, `components/HologramTerminalDemo.tsx`. None had unit tests, and `git grep` showed the page and eslint config as their only code references.

## Decisions Made

- The drawn lines are always `aria-hidden`, and the sr-only block is the one screen-reader source. The UI-SPEC says "aria-hidden while typing"; hiding them always also covers the completed command, which a screen reader would otherwise read twice in browse mode. 11-03's grade sentence goes into the same sr-only text.
- The dot bar is `role="group"` with `aria-label="Commands"`.
- Overview comes before Demo (the ENG-02 order). 11-08 replaces both with the CaseStudy template.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The fake-timer test helper fired only one tick per advance**
- **Found during:** Task 2 GREEN
- **Issue:** `act(() => jest.advanceTimersByTime(150))` fires a single tick, because the island schedules its next timeout from an effect that React runs only when the act flushes. The "types command 2" test therefore saw one character, not three.
- **Fix:** `advance(ms)` now steps in 10 ms `act()` calls, which mirrors real time. No assertion changed.
- **Files modified:** components/projects/__tests__/DemoTerminal.test.tsx
- **Committed in:** 94cb20b

**2. [Rule 3 - Blocking] e2e had to clear the temporary pause sources the plan's e2e steps did not mention**
- **Found during:** Task 1 and Task 2 e2e
- **Issue:** The region starts below the fold, so it is offscreen and therefore paused. A click leaves the pointer over the region and focus on the button, so it is hovered and focused, which also pauses it. Read literally, "a second click ... data-command changes within 8 s" and "starts playing" would fail.
- **Fix:** A `leaveTerminal()` helper moves the pointer to (0, 0) and blurs after each click. The hover and Tab tests call `scrollIntoViewIfNeeded()` before expecting `playing`.
- **Files modified:** e2e/case-study.spec.ts
- **Committed in:** cf369b5, 94cb20b

**3. [Rule 1 - Acceptance] A JSDoc line made `grep -c setTimeout` print 2**
- **Fix:** Reworded the comment; the count is now 1. Committed in cf369b5.

---

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3)
**Impact on plan:** Test-harness and wording fixes only. Behaviour matches the plan and UI-SPEC.

## Issues Encountered

- **Dev-server flakes:** a fresh dev server remounted the page once on a cold compile, which reset the terminal mid-test, and once returned HTTP 500 for `/projects/no-such-slug` under `--repeat-each=4` parallel load. Neither happened on a production build: 22/22 tracer runs with 16 workers, 55/55 chromium on the plan verification set (case-study, no-webgl, shell, projects), and 15/15 firefox. Both are logged in `deferred-items.md`; CI runs a production build.

## Open Question for Tim (not a blocker)

D-02 makes hover and focus-within pause **temporarily**, and the plan's truths test exactly that. One consequence: a visitor who presses Pause again to resume, with the mouse, still has the pointer over the terminal and focus on the button. It stays paused (`data-playback="paused"`, toggle unpressed) until both leave. The behaviour is as specified, but the press looks like it did nothing at first.

| Option | Pros | Cons |
|--------|------|------|
| A: Keep as built (D-02 literal) | Matches the UI-SPEC and every test; hover and focus always mean "hold still" | Resuming by mouse looks unresponsive until the pointer leaves |
| B: An explicit un-press clears the current hover and focus pauses until the next enter | The press resumes at once, as in the WAI carousel's explicit start | Changes D-02 semantics; needs UI-SPEC, test and e2e updates |

## Known Stubs

| File | Stub | Resolved by |
|------|------|-------------|
| `app/(site)/projects/[slug]/page.tsx` | The Demo section has its h2 but no intro paragraph | 11-09 (Tim-approved D-16 copy) |
| `components/projects/DemoTerminal.tsx` | No D-04 risk badge in the body and no "Grade T1, Low, score 0.15." sentence in the sr-only text | 11-03 |

Both are recorded in `.planning/WINDOWS.md`. The v1 `riskColors` pills left with the v1 terminal, as the plan's "Risk badge gap" assumption allows.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **For 11-03:** add the D-04 badge as line 3 of `CommandLines` (`mt-2`, between the command line and the warning) and the grade sentence to `spokenCommand()` after `Command: …`. The badge must also render inside the invisible cells, so the height reservation still holds. Delete the `.hologram-content` CSS (11-03 owns it).
- **For 11-08:** `DemoTerminal` takes `commands` only. Move the `#demo` section into the CaseStudy template unchanged.
- **For 11-10:** the e2e finds the pkill command by its output in `data/projects.ts`, so inserting new commands does not break it.
- **Visual:** the `clix-cli` baseline changes (no 3D laptop; Overview before Demo). `clix-website` may shift slightly because Overview is no longer inside the `space-y-20` client wrapper. The phase re-baseline covers both; only Tim commits PNGs.

## Self-Check: PASSED

- Files: lib/demo-terminal.ts, lib/__tests__/demo-terminal.test.ts, components/projects/DemoTerminal.tsx, components/projects/__tests__/DemoTerminal.test.tsx and e2e/case-study.spec.ts all FOUND. The three v1 files are absent.
- Commits: cf369b5, 7eef6ba and 94cb20b are ancestors of HEAD, and `check evaluation-scope --plan 11-01` resolves them.
- Acceptance: Task 1 AC1-AC5 PASS (dynamicParams 1, generateMetadata 2, files deleted, 3 legacy entries, aria-pressed 3 and setTimeout 1, list shows CLIX-CLI and THREE.WebGLRenderer). Task 2 AC1-AC4 PASS (24 it/test lines; IntersectionObserver 3, visibilitychange 3, "Go to command" 1, aria-live 2).
- Verification: `npm run lint` exit 0 (0 errors; 13 warnings, all in pre-existing legacy files); `npm run type-check` clean; `npx jest` 973/973; `guard:tests` OK (1349 vs 1300); Playwright as listed under Issues Encountered.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
