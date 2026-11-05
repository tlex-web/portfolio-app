---
phase: 11-engineering-roadmap
plan: 11
subsystem: ui
tags: [nextjs, server-components, tailwind, case-study, playwright, jest]

requires:
  - phase: 11-07
    provides: CaseStudy slot switch (SECTION_ORDER, slotMeta, caseStudySections) and the approved box/coin-flip data
provides:
  - "components/projects/sections/Problem.tsx: Problem({ id, label, paragraphs })"
  - "components/projects/sections/Pipeline.tsx: Pipeline({ id, label, name, block }) ordered-list diagram with literal md:grid-cols-3/4"
  - "components/projects/sections/Safety.tsx: Safety({ id, label, block }) intro, static preview figure, --force line"
  - "components/projects/sections/Privacy.tsx: Privacy({ id, label, block }) dash-marked facts"
  - "CaseStudy renders problem, pipeline and the third slot (Safety on box, Privacy on coin-flip)"
  - "Live anchors: #problem, #pipeline, #safety (box), #privacy (coin-flip)"
affects: [11-12, 11-13, 11-14, 11-17]

actuals:
  tokens: 9800
  tasks: 2
  commits: 5
plan_head_before: 90cd6926ec6bf8424f6140b2fe78864699c019e3
plan_head_after: a3d36680c49c81238084df1723f42760483fd002

tech-stack:
  added: []
  patterns:
    - "Section renderer signature: ({ id, label, ...data }) spread from slotMeta, heading id `${id}-title`, section aria-labelledby, null when the block has nothing approved"
    - "Literal class map per count (COLS record) instead of an interpolated Tailwind class (G11)"
    - "Flag-in-prose rendering: split the approved sentence on the first literal '--force' and wrap it in <code>"

key-files:
  created:
    - components/projects/sections/Problem.tsx
    - components/projects/sections/Pipeline.tsx
    - components/projects/sections/Safety.tsx
    - components/projects/sections/Privacy.tsx
    - components/projects/__tests__/CaseStudy.test.tsx
    - components/projects/__tests__/sections.test.tsx
  modified:
    - components/projects/CaseStudy.tsx
    - e2e/case-study.spec.ts

key-decisions:
  - "Pipeline connectors are a real aria-hidden <span> per gap (not li pseudo-elements), carrying the 4 px chevron as its md:after; vertical below 768 px, horizontal from 768 px"
  - "Stage numbers 01-0n stay readable to assistive tech (not aria-hidden): Tailwind preflight removes list markers, and Safari drops list semantics then, so the number keeps the sequence audible"
  - "Safety figcaption uses min-h-12 rather than h-12 and wraps its two nowrap units in one inline span, so the ' · ' keeps its spaces inside the flex row and a long command can wrap without overflowing the bar"
  - "box Safety renders only with an intro or a capture; a forceLine alone never renders (it describes the capture)"
  - "Pipeline's In line sits mt-6 above the list and the list then moves to mt-4, grouping the endpoint with the stages; the Out line follows at mt-4"
  - "No inline-code rendering in Problem prose (--clip, ConvertFrom-Json): Tim has not answered that question, so only Safety's --force line gets a code element, as planned"

patterns-established:
  - "sections/*.tsx are Server Components with no client directive and no hooks"
  - "Component tests use fixture projects typed as Project for both slugs; real data is read only where the contract is about it (fairness wording, D-30 honesty)"

requirements-completed: [ENG-02]

coverage:
  - id: D1
    description: "Problem renders each approved paragraph in order; omitted without paragraphs"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#Problem"
        status: pass
    human_judgment: false
  - id: D2
    description: "coin-flip Privacy: optional intro and one dash-marked li per approved fact, no fairness wording; omitted without facts"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#Privacy"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#coin-flip Privacy lists its facts and Pipeline holds the fairness intro (D-25)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pipeline: ol named '{name} pipeline, {n} stages', numbered plates, descriptions only when approved, intro and In/Out lines only when approved, literal md:grid-cols-3/4"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#Pipeline"
        status: pass
    human_judgment: false
  - id: D4
    description: "box Safety: intro, static 'Preview run · box {command}' figure whose pre equals the capture exactly, --force sentence with the flag in code; partial and empty cases; no button or tabindex"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/sections.test.tsx#Safety"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#box Safety shows the real preview output (D-25)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Fixed slot order and per-project third-slot label on both pages; absent blocks leave no heading"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/CaseStudy.test.tsx"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#sections keep the fixed order on /projects/{slug} (ENG-02)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Neither case study scrolls sideways at 375 px and the preview block wraps inside its frame"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#at 375 px neither case study scrolls sideways"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the pipeline plates, connectors and preview block at 375 and 1440 px"
    verification: []
    human_judgment: true
    rationale: "Spacing and connector legibility are visual judgments; checked on screenshots here, and the 11-17 re-baseline covers the changed case-study screenshots"

duration: 8min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 11: Problem, Pipeline and the Safety/Privacy slot Summary

**The case studies now read Problem, an ordered-list Pipeline diagram and their own third slot: box shows its real `bulk-rename` preview run with the `--force` line, coin-flip its three privacy facts, with the fairness fact in its Pipeline intro.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-01T21:35:39Z
- **Completed:** 2026-11-01T21:43:49Z
- **Tasks:** 2 (both TDD: RED then GREEN, plus one comment-only refactor)
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- `sections/Problem.tsx`: h2 plus one `mt-4 max-w-prose text-base text-ink-muted` paragraph per approved item; null without paragraphs.
- `sections/Privacy.tsx`: optional intro and a `max-w-prose` list with the 8 x 1 px dash marker (`before:top-3`), `gap-2`; null without facts.
- `sections/Pipeline.tsx`: optional intro, optional `In:` line, `<ol aria-label="{name} pipeline, {n} stages">` of plates (Mono `01`, semibold name, optional description), aria-hidden 1 px connectors (vertical below 768 px, horizontal with a 4 px chevron from 768 px), optional `Out:` line; columns from the literal `COLS` record.
- `sections/Safety.tsx`: intro, then a `<figure aria-labelledby="safety-capture">` with the caption bar 'Preview run · box {command}' and a `whitespace-pre-wrap wrap-anywhere` pre holding `❯ `, the typed line and the captured output as React text children; then the `--force` sentence with the flag in `<code>`. No copy button (default.11 = default), no scroll container, nothing focusable.
- `CaseStudy.tsx`: the problem, pipeline and safety cases now return their sections; Safety on box needs an intro or a capture, Privacy on coin-flip needs a privacy block.

## Slots rendered per page now

| Page | Sections, in order |
|------|--------------------|
| /projects/box | Problem, Pipeline (3 stages, approved in 11-02), Safety, Demo |
| /projects/coin-flip | Problem, Pipeline (4 stages, intro, In and Out), Privacy |

For 11-13: the `metrics`, `stack` and `next-steps` cases in `renderSlot` still return null (their data is complete); coin-flip's Demo still waits on 11-15/11-16.

## Task Commits

1. **Task 1 RED: failing tests for Problem, Privacy and the slot rules** - `8af63c1` (test)
2. **Task 1 GREEN: Problem and Privacy case-study sections** - `48dd9c8` (feat)
3. **Task 2 RED: failing tests for the pipeline diagram and the Safety preview** - `37ae371` (test)
4. **Task 2 GREEN: pipeline diagram and box Safety preview, with case-study e2e** - `0c35e5c` (feat)
5. **Task 2 REFACTOR: Pipeline comment names no computed class** - `a3d3668` (refactor)

**Plan metadata:** the docs(11-11) commit that adds this file.

## TDD record

- **RED 1** (`8af63c1`): 21 tests, 13 failed on assertions (missing h2/region/list items, `caseStudySections` returning `[]`), none on load: Problem and Privacy were committed as null-returning skeletons so the suite compiled. The 8 that passed are guards for behavior that already held (slotMeta labels, schema rejection of empty facts, omit cases). Semantic assessment: the target tests executed and failed for the intended reason.
- **GREEN 1** (`48dd9c8`): 21/21.
- **RED 2** (`37ae371`): 42 tests, 18 failed on assertions (Pipeline and Safety skeletons render nothing; box slot order lacked pipeline/safety). Semantic assessment: intended failures only.
- **GREEN 2** (`0c35e5c`): 42/42; REFACTOR (`a3d3668`) changes a comment only, tests still 80/80 in `components/projects`.
- The `gsd_run check tdd-red-evidence` classifier was not run: `workflow.tdd_mode` is false, this is a `type: execute` plan, and Jest's default reporter is not one of the classifier's supported formats. The RED evidence above is the semantic assessment from the actual runs.

## Test counts

- `components/projects/__tests__/CaseStudy.test.tsx` (new): 17 tests.
- `components/projects/__tests__/sections.test.tsx` (new): 25 tests (Problem 4, Privacy 5, Pipeline 8, Safety 8).
- `e2e/case-study.spec.ts`: 22 to 27 per browser (two slot-order tests, box Safety, coin-flip Privacy and Pipeline, 375 px over both slugs).
- Full Jest: 75 suites, 1191 tests. `guard:tests`: jest 1191 + e2e 419 = 1610 (baseline 1300), OK.
- Plan e2e (`case-study` and `no-webgl`, chromium and firefox, production build): 62/62.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Box slot-order tests moved from Task 1 to Task 2**
- **Found during:** Task 1
- **Issue:** Task 1's behavior list includes "caseStudySections(box fixture with problem, safety and demo) returns problem, safety, demo", but the plan puts box's Safety branch in Task 2, so that test could not go green in Task 1's GREEN commit.
- **Fix:** The box ordering and box Safety omit tests were written in Task 2's RED commit and went green with Task 2. Task 1 covered coin-flip and the label rule (slotMeta for both slugs).
- **Files modified:** components/projects/__tests__/CaseStudy.test.tsx
- **Committed in:** 37ae371, 0c35e5c

**2. [Rule 1 - Bug] Acceptance grep counted a comment**
- **Found during:** Task 2 acceptance
- **Issue:** `grep -cF 'md:grid-cols-${'` printed 1 because the COLS doc comment quoted the forbidden interpolated class as an example.
- **Fix:** Reworded the comment; no code change.
- **Committed in:** a3d3668

**3. [Rule 1 - Layout] Figcaption min-h-12 and inner span**
- **Found during:** Task 2
- **Issue:** As a flex container, the figcaption would drop the whitespace between its child units ("Preview run·box"), and a fixed `h-12` would let a long command overflow the bar.
- **Fix:** The units sit in one inline span inside the flex row, and the bar uses `min-h-12` (48 px for one line, as specified).
- **Committed in:** 0c35e5c

**Also:** Prettier reflowed three existing long lines in `e2e/case-study.spec.ts` when the file was formatted (formatting only).

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bug/layout)
**Impact on plan:** No scope change. The behavior is as specified, and one test moved to the task that ships the code it tests.

## Issues Encountered

- A bash heredoc holding the large test edit failed on quoting; the edit was applied with the Edit tool instead.
- The production-build e2e run rewrote `public/service-worker.js`; it was restored with `git restore` and never staged.
- Screenshots at 375 and 1440 px (scratchpad, not committed) were reviewed: the plates, connectors and preview block wrap cleanly, and the preview's long command line wraps inside the frame at 375 px.

## Known Stubs

| File | Stub | Resolved by |
|------|------|-------------|
| components/projects/CaseStudy.tsx | `metrics`, `stack` and `next-steps` cases return null (data complete) | 11-13 |

`.planning/WINDOWS.md` entry 6 (11-07) still covers this and stays open until 11-13; its problem/pipeline/safety part is resolved here.

## Threat Flags

None. The capture renders as escaped React text children; `dangerouslySetInnerHTML` count in `components/projects/sections/` is 0 (T-11-26).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 11-13 fills metrics, stack and next-steps; 11-14 composes the route index from `caseStudySections`, whose ids are now live for problem, pipeline and safety/privacy.
- Visual: both case studies gain three sections, so their screenshots change; the 11-17 re-baseline covers them (only Tim commits PNGs).

## Self-Check: PASSED

- Created files exist: sections/Problem.tsx, Pipeline.tsx, Safety.tsx, Privacy.tsx; __tests__/CaseStudy.test.tsx, sections.test.tsx.
- Commits 8af63c1, 48dd9c8, 37ae371, 0c35e5c and a3d3668 are ancestors of HEAD; `git rev-list --count 90cd692..HEAD` = 5.
- Acceptance: `<Problem` 1, `<Privacy` 1 in CaseStudy; CaseStudy test calls 17 (>= 5); `use client` 0 in all four sections; `md:grid-cols-4` 1 and `md:grid-cols-${` 0 in Pipeline; `Preview run` 1 and `tabIndex|<button` 0 in Safety.
- Verification: `npx jest components/projects` 80/80; full Jest 1191/1191; lint exit 0 (11 pre-existing warnings, none in touched files); type-check clean; e2e case-study and no-webgl, chromium and firefox, 62/62; guard:tests OK.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
