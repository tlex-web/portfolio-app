---
phase: 11-engineering-roadmap
plan: 13
subsystem: ui
tags: [nextjs, server-components, tailwind, case-study, playwright, jest]

requires:
  - phase: 11-11
    provides: CaseStudy slot switch with problem, pipeline and the third slot rendering; section heading pattern
  - phase: 11-08
    provides: roadmapItems (data/roadmap.ts) with coin-flip's planned rows
  - phase: 11-05
    provides: RouteRow variant compact, routeLogHref, STATUS_LABELS
provides:
  - "components/projects/sections/Metrics.tsx: Metrics({ id, label, tiles }) instrument panel with the G1 column rule"
  - "components/projects/sections/Stack.tsx: Stack({ id, label, groups }) chip groups"
  - "components/projects/sections/NextSteps.tsx: NextSteps({ id, label, slug, rows }) compact route rows plus Full route log"
  - "CaseStudy renders every data slot: problem, pipeline, safety/privacy, metrics, demo, stack, next-steps"
  - "Live anchors: #metrics, #stack (both pages), #next-steps (coin-flip)"
  - "RouteRow compact row is a plain anchor, so a followed Next steps link makes the row the :target"
affects: [11-14, 11-16, 11-17]

actuals:
  tokens: 7600
  tasks: 2
  commits: 4
plan_head_before: 426d4d63b78bd9baeb5d6e3257c7519607d37017
plan_head_after: 09b15a82a60b603b139d835d5c3b1079975e99d8

tech-stack:
  added: []
  patterns:
    - "Last-tile span from small literal maps (sm orphan when the count is odd, lg rest by count mod 3), never an interpolated class (G1, G11)"
    - "nextSteps ids resolve against roadmapItems in CaseStudy: same project, not completed, in the project's order"

key-files:
  created:
    - components/projects/sections/Metrics.tsx
    - components/projects/sections/Stack.tsx
    - components/projects/sections/NextSteps.tsx
    - components/projects/__tests__/Metrics.test.tsx
  modified:
    - components/projects/CaseStudy.tsx
    - components/roadmap/RouteRow.tsx
    - components/projects/__tests__/sections.test.tsx
    - data/__tests__/projects.test.ts
    - e2e/case-study.spec.ts

key-decisions:
  - "The compact RouteRow (Next steps) is a plain <a>, not next/link: next/link navigates with history.pushState, which never sets the document's :target, so the landed row lost its target: highlight (e2e failed on it). A document navigation to the static /roadmap fixes it; the cost is no prefetch and a full page load for that one link. Full route log stays next/link (no fragment)"
  - "The metrics releaseLine is not repeated in the case-study panel: every context line already names its release, and the plan and UI-SPEC give the panel no release line (the 11-12 route panel strip keeps it)"
  - "The Source link stays named 'Source' (the visible text, WCAG 2.5.3); its purpose comes from its dd context (2.4.4). Same tab, as the GitHub link (§I #7 default)"
  - "The last-tile span is a function over literal maps rather than a 1-5 table, so a sixth or seventh tile still never exposes a bg-line cell; tests pin the 1-5 results"
  - "The next-steps resolver also requires row.area === project.slug, so a row of another project can never appear under a case study; the data test asserts the same"

patterns-established:
  - "A section receives already-resolved rows (NextSteps gets RouteLogItems, not ids); resolution and dropping live in CaseStudy"

requirements-completed: [ENG-02, ENG-04, ROUTE-01]

coverage:
  - id: D1
    description: "Metrics instrument panel: dl with gap-px rules, dt label, Mono tabular value, required context line, data order, no h3, nothing for an empty list, values in the first static render"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#Metrics panel structure"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Metrics tiles show the audited values with their context lines on /projects/{slug} (ENG-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: "G1 columns: 1 tile grid-cols-1; 2 tiles sm:grid-cols-2 only; 3+ sm:grid-cols-2 lg:grid-cols-3; orphan spans (3rd sm:col-span-2 lg:col-span-1, 4th lg:col-span-3, 5th sm/lg col-span-2)"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#Metrics columns follow the tile count (G1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "box tiles carry a same-tab 'Source' link after the context; coin-flip tiles never link (data test and e2e)"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#no coin-flip metric tile links to a source (D-23)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Metrics tiles show the audited values with their context lines on /projects/coin-flip (ENG-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Stack: h3 per group in order, single group without h3, nowrap non-interactive chips that wrap, omitted without data"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#Stack"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Stack lists each approved group and its chips"
        status: pass
    human_judgment: false
  - id: D5
    description: "Next steps: compact rows linking to /roadmap?project=coin-flip#{id} in the project's order, then Full route log; unknown/completed ids dropped; box omitted (N4); following a row lands with it as the :target"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#NextSteps"
        status: pass
      - kind: unit
        ref: "data/__tests__/projects.test.ts#Next steps against the route log (N4, D-30, D-32)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#coin-flip Next steps link into the filtered route log (ROUTE-01)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#box has no Next steps section (N4)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Fixed slot order on both pages: Metrics after the third slot and before Demo, Stack and Next steps after Demo"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#Metrics in the case-study slot order (ENG-02)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#sections keep the fixed order on /projects/{slug} (ENG-02)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the metrics panel, chips and next-steps rows at 375 and 1440 px"
    verification: []
    human_judgment: true
    rationale: "Spacing and hierarchy are visual judgments; reviewed on scratch screenshots here, and the 11-17 re-baseline covers the changed case-study screenshots"

duration: 10min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 13: Metrics, Stack and Next steps Summary

**Both case studies now end their data sections with an instrument-panel Metrics block whose columns follow the tile count, Stack chip groups, and (coin-flip) Next steps rows that land on their own highlighted row in the filtered route log.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-01T22:15:52Z
- **Completed:** 2026-11-01T22:25:32Z
- **Tasks:** 2 (both TDD: RED then GREEN)
- **Files modified:** 9 (4 created, 5 modified)

## Accomplishments

- `sections/Metrics.tsx`: one `dl` panel (`gap-px` on `bg-line` inside a `rounded-lg border`), each tile `bg-surface-raised p-6` with `dt`, a Mono `text-heading font-semibold tabular-nums` value and the context `dd`; a box tile with `sourceUrl` ends its context with a prose `Source` link and `ArrowSquareOutIcon` 16. Server-rendered, no state.
- `sections/Stack.tsx`: `md:grid-cols-2 lg:grid-cols-3` groups, h3 only when there are two or more groups, `whitespace-nowrap` chips in a wrapping `ul`.
- `sections/NextSteps.tsx`: `ul` of `RouteRow variant="compact"`, then `Full route log` (`next/link`, `ArrowRightIcon` 20) to `/roadmap?project={slug}`.
- `CaseStudy.tsx`: metrics, stack and next-steps cases; `nextStepRows()` resolves ids against `roadmapItems`.
- `RouteRow.tsx`: the compact row is a plain anchor so the landed row is the `:target` (see Deviations).

## Slots rendered per page now

| Page | Sections, in order |
|------|--------------------|
| /projects/box | Problem, Pipeline, Safety, Metrics (3 tiles), Demo, Stack (3 groups) |
| /projects/coin-flip | Problem, Pipeline, Privacy, Metrics (2 tiles), Stack (2 groups), Next steps (2 rows) |

coin-flip's Demo joins between Metrics and Stack once 11-15/11-16 land the clip.

## Tile counts and spans in use

- box, 3 tiles: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; Binary (third) carries `sm:col-span-2 lg:col-span-1`.
- coin-flip, 2 tiles (Network calls softened out, N3): `grid-cols-1 sm:grid-cols-2`; no spans.

## Task Commits

1. **Task 1 RED: failing tests for the metrics instrument panel** - `0cbabd2` (test)
2. **Task 1 GREEN: metrics instrument panel with the G1 column rule (ENG-04)** - `8a0743c` (feat)
3. **Task 2 RED: failing tests for stack, next steps and the route-log cross-check** - `4c05750` (test)
4. **Task 2 GREEN: stack chips and next steps linked into the route log (ENG-02)** - `09b15a8` (feat)

**Plan metadata:** the docs(11-13) commit that adds this file.

## TDD record

- **RED 1** (`0cbabd2`): 12 tests, 10 failed on assertions (no Metrics region, empty static markup, slot order without metrics); the 2 that passed are guards (empty list renders nothing, no metrics block omits the slot). Metrics.tsx was committed as a null skeleton so the suite compiled. Semantic assessment: target tests executed and failed for the intended reason.
- **GREEN 1** (`8a0743c`): Metrics 12/12, CaseStudy 17/17.
- **RED 2** (`4c05750`): 11 new component tests failed on assertions (Stack/NextSteps skeletons render nothing; caseStudySections lacks stack and next-steps). The 4 new data tests and the omit cases passed at RED because the data already complies; they are guards, not RED targets.
- **GREEN 2** (`09b15a8`): `components/projects`, `components/roadmap` and the data test 198/198.
- The `gsd_run check tdd-red-evidence` classifier was not run: `workflow.tdd_mode` is false, this is a `type: execute` plan, and Jest's default reporter is not a supported format. The RED evidence is the semantic assessment from the actual runs.

## Test counts

- `components/projects/__tests__/Metrics.test.tsx` (new): 12 tests.
- `components/projects/__tests__/sections.test.tsx`: 25 to 41 (Stack 5, NextSteps 5, case-study wiring 6).
- `data/__tests__/projects.test.ts`: +5 (coin-flip sourceUrl rule, coin-flip has next steps, one per next-step id x2, box N4).
- `e2e/case-study.spec.ts`: 27 to 32 per browser (Metrics x2, Stack, Next steps, box N4; slot-order test extended).
- Full Jest: 79 suites, 1257 tests. `guard:tests`: jest 1257 + e2e 432 = 1689 (baseline 1300), OK.
- Plan e2e (`case-study`, `roadmap`, `projects`; chromium and firefox; production build): 144/144.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Following a Next steps row did not make it the :target**
- **Found during:** Task 2 (e2e 'coin-flip Next steps link into the filtered route log')
- **Issue:** The compact RouteRow linked with `next/link`. Next's App Router navigates client-side with `history.pushState` and scrolls to the hash with `scrollIntoView`, but pushState never updates the document's target element, so the row's `target:bg-surface-overlay` highlight did not apply and `:target` was false (plan truth: "lands on /roadmap with that row as the :target"). A direct load of the same URL worked (the 11-08 roadmap tests).
- **Fix:** The compact variant renders a plain `<a>` with the same href and classes, so the browser does a document navigation and sets `:target` itself. The `next/link` import left RouteRow (the log variant has no link). `RouteLog.test.tsx` compact tests unchanged and green.
- **Trade-off for Tim:** this link loses prefetch and is a full page load of the static /roadmap. The alternative is keeping `next/link` and accepting no landing highlight (or a client script that re-sets the hash, which adds JS to /roadmap). Easy to revert in `components/roadmap/RouteRow.tsx` if you prefer soft navigation.
- **Files modified:** components/roadmap/RouteRow.tsx (outside the plan's files list)
- **Committed in:** 09b15a8

**2. [Rule 2 - Correctness] Next-steps resolver checks the project**
- **Found during:** Task 2
- **Issue:** The plan's resolver keeps planned or in-progress rows only; a row of another project would still have rendered.
- **Fix:** `nextStepRows()` also requires `row.area === project.slug`; the data test asserts the same.
- **Committed in:** 09b15a8

**Also:** the e2e slot-order test asserts relative positions (Metrics right after the third slot, Stack after Metrics and Demo, Next steps last) instead of a fixed list, so coin-flip's Demo from 11-15/11-16 does not break it. `e2e/case-study.spec.ts:117` ("coin-flip has no Demo section") is left for 11-16 as instructed.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 correctness)
**Impact on plan:** No scope change; one shared component (RouteRow compact) changed its link element.

## Issues Encountered

- A bash heredoc holding the large test edit failed on quoting (as in 11-11); the edits were applied with the Edit tool.
- The production-build e2e runs rewrote `public/service-worker.js`; it was restored with `git restore` each time and never staged.
- Screenshots of #metrics, #stack and #next-steps at 375 and 1440 px (scratchpad, not committed; the throwaway spec was deleted) were reviewed: rules between tiles, chip wrap and row separators render cleanly, nothing overflows at 375 px.

## Known Stubs

None. `.planning/WINDOWS.md` entry 6 (CaseStudy slots returning null) is now marked fixed.

## Threat Flags

None. T-11-29: the data test fails on any coin-flip tile with a sourceUrl, and e2e asserts no link in coin-flip's #metrics. T-11-30: row hrefs come from `routeLogHref` with enum values plus a row id the data test proves exists in `roadmapItems`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 11-14 can compose the route index from `caseStudySections`: ids `metrics`, `stack`, `next-steps` are live.
- Visual: both case studies gain sections, so their screenshots change; the 11-17 re-baseline covers them (only Tim commits PNGs).
- Open for Tim: the plain-anchor choice for Next steps rows (Deviation 1).

## Self-Check: PASSED

- Created files exist: sections/Metrics.tsx, Stack.tsx, NextSteps.tsx; __tests__/Metrics.test.tsx.
- Commits 0cbabd2, 8a0743c, 4c05750 and 09b15a8 are ancestors of HEAD; `git rev-list --count 426d4d6..HEAD` = 4.
- Acceptance: Metrics test calls 12 (>= 8); `grid-cols-${` 0 in Metrics.tsx; `<Metrics` 1, `<Stack` 1, `<NextSteps` 1 in CaseStudy; `roadmapItems` 4 in projects.test.ts; `variant="compact"` 1 in NextSteps.tsx; no `.only(`, `.skip(`, `.fixme(`.
- Verification: full Jest 1257/1257; lint exit 0 (11 pre-existing warnings, none in touched files); type-check clean; e2e case-study, roadmap and projects, chromium and firefox, production build, 144/144; guard:tests OK.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
